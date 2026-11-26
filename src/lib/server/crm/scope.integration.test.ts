import { readFile, readdir } from 'node:fs/promises';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getPlatformProxy, type PlatformProxy } from 'wrangler';
import { getDb, type Db } from '#lib/server/db/index.ts';
import { addDays, todayIso } from '#lib/domain/dates.ts';
import { load as layout } from '../../../routes/(app)/+layout.server.ts';
import { actions as queueActions, load as queue } from '../../../routes/(app)/+page.server.ts';
import { load as customers } from '../../../routes/(app)/customers/+page.server.ts';
import { actions as newCustomer } from '../../../routes/(app)/customers/new/+page.server.ts';
import {
	actions as detailActions,
	load as detail
} from '../../../routes/(app)/customers/[id]/+page.server.ts';
import {
	actions as editActions,
	load as edit
} from '../../../routes/(app)/customers/[id]/edit/+page.server.ts';
import {
	actions as importActions,
	load as importPreview
} from '../../../routes/(app)/import/+page.server.ts';
import { GET as picker } from '../../../routes/(app)/orders/new/customers/+server.ts';
import {
	actions as orderActions,
	load as newOrder
} from '../../../routes/(app)/orders/new/+page.server.ts';
import {
	actions as settingsActions,
	load as settings
} from '../../../routes/(app)/settings/+page.server.ts';
import { createCustomer, findByPhone, getCustomerDetail } from './customers.ts';
import { createOrder, deleteOrder, listOrders } from './orders.ts';
import {
	createProduct,
	getRules,
	listProducts,
	toTemplates,
	templatesQuery,
	updateProduct,
	updateRules
} from './settings.ts';
import { getInsights } from './insights.ts';
import { markSent, queueCount, recordOutcome, snooze } from './follow-ups.ts';
import type { CrmScope } from './scope.ts';

let platform: PlatformProxy<{ DB: D1Database }> | undefined;
let d1: D1Database;
let db: Db;
const date = '2025-05-12';
const today = todayIso();
const phone = '628123456789';
const defaults = { leadDays: 3, retryDays: 2, maxAttempts: 3, winbackDays: 30 };
const defaultTemplates = {
	reorder:
		'Halo Kak {nama}, ini {cs}. Stok {produk} Kakak kira-kira tinggal beberapa hari lagi. Mau sekalian disiapkan order berikutnya supaya minumnya nggak terputus?',
	retry:
		'Halo Kak {nama}, {cs} lagi ya. Kemarin sempat tanya soal {produk}. Kalau mau lanjut order, kabari saja ya Kak.',
	lead: 'Halo Kak {nama}, ini {cs}. Terima kasih sudah tertarik dengan {produk}. Ada yang bisa {cs} bantu jelaskan?',
	winback:
		'Halo Kak {nama}, apa kabar? Sudah lama nggak minum {produk} ya. Kalau mau mulai lagi, {cs} siap bantu.',
	closing:
		'Halo Kak {nama}, ini {cs}. Kemarin Kakak sempat tertarik dengan {produk}. Mau {cs} bantu siapkan ordernya sekarang?'
};
const productInput = {
	name: 'ROOVE',
	unitLabel: 'sachet',
	servingsPerUnit: 1,
	price: 12345,
	active: true
};
const orderInput = { orderDate: date, qty: 8, dosePerDay: 1, totalPaid: 85000, note: null };
const customerInput = { name: 'A private customer', phone, dosePerDay: 1, notes: null };

async function account(ownerId: string): Promise<CrmScope> {
	await d1
		.prepare('INSERT INTO "user" (id, name, email) VALUES (?, ?, ?)')
		.bind(ownerId, ownerId, `${ownerId}@example.com`)
		.run();
	return { db, ownerId };
}

beforeAll(async () => {
	platform = await getPlatformProxy<{ DB: D1Database }>({
		configPath: './wrangler.jsonc',
		persist: false,
		remoteBindings: false,
		envFiles: []
	});
	d1 = platform.env.DB;
	db = getDb(d1);
	const migrations = (await readdir('drizzle')).filter((name) => name.endsWith('.sql')).sort();
	for (const file of migrations) {
		if (file.startsWith('0005_')) await account('backfill');
		const sql = await readFile(`drizzle/${file}`, 'utf8');
		await d1.batch(sql.split('--> statement-breakpoint').map((s) => d1.prepare(s.trim())));
	}
	await account('signup');
}, 15_000);

afterAll(async () => {
	await platform?.dispose();
});

async function addCustomer(crm: CrmScope, input = customerInput, due = date) {
	const result = await createCustomer(crm, input, due);
	if (!('id' in result)) throw new Error(`Duplicate fixture: ${input.phone}`);
	const joined = await getCustomerDetail(crm, result.id);
	if (!joined?.openFollowUp) throw new Error(`Missing initial follow-up: ${result.id}`);
	return { id: result.id, followUpId: joined.openFollowUp.id };
}

// Use real Request/FormData; only the unused SvelteKit event properties are omitted.
async function invoke<T>(
	handler: (event: never) => T,
	crm: CrmScope,
	options: {
		id?: string;
		path?: string;
		fields?: Record<string, string | number | boolean | null>;
	} = {}
): Promise<Awaited<T>> {
	const url = new URL(options.path ?? '/', 'http://localhost');
	const body = options.fields ? new FormData() : undefined;
	for (const [key, value] of Object.entries(options.fields ?? {})) {
		if (value !== null) body?.set(key, String(value));
	}
	return await handler({
		url,
		request: new Request(url, body ? { method: 'POST', body } : undefined),
		params: { id: options.id },
		locals: { crm, user: { id: crm.ownerId, name: crm.ownerId } }
	} as never);
}

describe('private CRM on D1', () => {
	it('provisions existing and new accounts independently and keys changes by immutable user id', async () => {
		const a = { db, ownerId: 'backfill' };
		const b = { db, ownerId: 'signup' };
		for (const crm of [a, b]) {
			const page = await invoke(settings, crm);
			expect(page).toMatchObject({ rules: defaults, templates: defaultTemplates });
			expect(page?.products).toEqual([
				{
					id: `prod_roove:${crm.ownerId}`,
					name: 'ROOVE',
					unitLabel: 'sachet',
					servingsPerUnit: 1,
					active: true,
					price: 10100,
					createdAt: expect.any(Date)
				}
			]);
		}
		const changedRules = { ...defaults, leadDays: 5 };
		const editedTemplates = { ...defaultTemplates, lead: 'Hi {nama}, {cs} here' };
		expect(await invoke(settingsActions.rules, a, { fields: changedRules })).toMatchObject({
			ok: true,
			action: 'rules'
		});
		expect(await invoke(settingsActions.templates, a, { fields: editedTemplates })).toMatchObject({
			ok: true,
			action: 'templates'
		});
		expect(
			await invoke(queueActions.saveTemplate, a, {
				fields: { kind: 'retry', body: 'Retry {produk}' }
			})
		).toMatchObject({ ok: true, action: 'saveTemplate' });
		expect(await updateProduct(a, 'prod_roove:backfill', productInput)).toEqual({ ok: true });
		expect(await updateProduct(b, 'prod_roove:signup', { ...productInput, active: false })).toEqual(
			{ ok: false, errors: { active: 'last_active' } }
		);
		for (const crm of [a, b])
			expect(await createProduct(crm, { ...productInput, name: 'Fiber' })).toEqual({ ok: true });
		expect(await createProduct(a, { ...productInput, name: 'fiBER' })).toEqual({
			ok: false,
			errors: { name: 'duplicate' }
		});
		await d1
			.prepare('UPDATE "user" SET name = ?, email = ? WHERE id = ?')
			.bind('Renamed', 'renamed@example.com', a.ownerId)
			.run();
		expect(await getRules(a)).toEqual(changedRules);
		expect(toTemplates(await templatesQuery(a))).toEqual({
			...editedTemplates,
			retry: 'Retry {produk}'
		});
		expect(await listProducts(a)).toEqual(
			expect.arrayContaining([expect.objectContaining({ id: 'prod_roove:backfill', price: 12345 })])
		);
		expect(await getRules(b)).toEqual(defaults);
		expect(toTemplates(await templatesQuery(b))).toEqual(defaultTemplates);
		expect(await listProducts(b)).toEqual(
			expect.arrayContaining([expect.objectContaining({ id: 'prod_roove:signup', price: 10100 })])
		);

		const sa = await addCustomer(a);
		const sb = await addCustomer(b, { ...customerInput, name: 'B own match' });
		const duplicate = await invoke(newCustomer.default, b, {
			fields: { name: 'Repeat', phone: '08123456789', dosePreset: 1 }
		});
		expect(duplicate).toMatchObject({
			status: 400,
			data: { errors: { phone: 'duplicate' }, duplicateOf: { id: sb.id, name: 'B own match' } }
		});
		expect(await getCustomerDetail(a, sa.id)).toMatchObject({
			customer: { name: customerInput.name }
		});
	});

	it('enforces composite parents and optional links and preserves history on deletion', async () => {
		const a = await account('constraint-a');
		const b = await account('constraint-b');
		const ca = await addCustomer(a);
		const cb = await addCustomer(b);
		const otherA = await addCustomer(a, { ...customerInput, phone: '628123456780' });
		const badOrder = d1.prepare(
			'INSERT INTO customer_order (id, owner_id, customer_id, product_id, order_date, qty, dose_per_day, days_supply) VALUES (?, ?, ?, ?, ?, 8, 1, 8)'
		);
		await expect(
			badOrder.bind('bad-product', a.ownerId, ca.id, `prod_roove:${b.ownerId}`, date).run()
		).rejects.toThrow(/FOREIGN KEY/);
		await expect(
			badOrder.bind('bad-customer', a.ownerId, cb.id, `prod_roove:${a.ownerId}`, date).run()
		).rejects.toThrow(/FOREIGN KEY/);
		await expect(
			d1
				.prepare(
					"INSERT INTO follow_up (id, owner_id, customer_id, kind, due_date) VALUES ('second-open', ?, ?, 'lead', ?)"
				)
				.bind(a.ownerId, ca.id, date)
				.run()
		).rejects.toThrow(/UNIQUE/);
		const ownOrder = await createOrder(a, {
			...orderInput,
			customerId: ca.id,
			productId: `prod_roove:${a.ownerId}`
		});
		const foreignOrder = await createOrder(b, {
			...orderInput,
			customerId: cb.id,
			productId: `prod_roove:${b.ownerId}`
		});
		const badLink = d1.prepare(
			"INSERT INTO activity (id, owner_id, customer_id, type, order_id) VALUES ('bad-link', ?, ?, 'note', ?)"
		);
		await expect(badLink.bind(a.ownerId, ca.id, foreignOrder.orderId).run()).rejects.toThrow(
			/same customer and owner/
		);
		await expect(badLink.bind(a.ownerId, otherA.id, ownOrder.orderId).run()).rejects.toThrow(
			/same customer and owner/
		);
		await expect(
			d1
				.prepare('UPDATE follow_up SET order_id = ? WHERE id = ?')
				.bind(foreignOrder.orderId, ca.followUpId)
				.run()
		).rejects.toThrow(/same customer and owner/);
		await expect(
			d1.prepare('DELETE FROM product WHERE id = ?').bind(`prod_roove:${a.ownerId}`).run()
		).rejects.toThrow(/FOREIGN KEY/);
		const oldHistory = await getCustomerDetail(a, ca.id);
		await deleteOrder(a, ca.id, ownOrder.orderId);
		const after = await getCustomerDetail(a, ca.id);
		expect(after?.orders).toEqual([]);
		expect(after?.activities.map(({ id, type, body }) => ({ id, type, body }))).toEqual(
			oldHistory?.activities.map(({ id, type, body }) => ({ id, type, body }))
		);
		expect(after?.activities.find(({ type }) => type === 'order')?.orderProduct).toBeNull();
		expect(
			await d1.prepare('SELECT order_id FROM follow_up WHERE id = ?').bind(ca.followUpId).first()
		).toEqual({ order_id: null });
		await createOrder(a, {
			...orderInput,
			customerId: ca.id,
			productId: `prod_roove:${a.ownerId}`
		});
		const beforeB = await getCustomerDetail(b, cb.id);
		await d1.prepare('DELETE FROM "user" WHERE id = ?').bind(a.ownerId).run();
		for (const table of [
			'customer',
			'product',
			'customer_order',
			'follow_up',
			'activity',
			'setting',
			'message_template'
		]) {
			expect(
				await d1
					.prepare(`SELECT count(*) AS n FROM ${table} WHERE owner_id = ?`)
					.bind(a.ownerId)
					.first()
			).toEqual({ n: 0 });
		}
		expect(await getCustomerDetail(b, cb.id)).toEqual(beforeB);
		expect((await d1.prepare('PRAGMA foreign_key_check').all()).results).toEqual([]);
	});

	it('keeps picker, customer, queue, orders, and every insights input private', async () => {
		const a = await account('reads-a');
		const b = await account('reads-b');
		const ca = await addCustomer(a);
		await invoke(detailActions.note, a, { id: ca.id, fields: { body: 'A-only note' } });
		await createOrder(a, {
			...orderInput,
			orderDate: '2025-04-29',
			totalPaid: 110,
			customerId: ca.id,
			productId: `prod_roove:${a.ownerId}`
		});
		await d1
			.prepare(
				"INSERT INTO activity (id, owner_id, customer_id, type, created_at) VALUES ('reads-sent', ?, ?, 'wa_sent', ?)"
			)
			.bind(a.ownerId, ca.id, Date.parse('2025-05-10T03:00:00Z'))
			.run();
		const order = await createOrder(a, {
			...orderInput,
			customerId: ca.id,
			productId: `prod_roove:${a.ownerId}`
		});
		await d1
			.prepare('UPDATE follow_up SET completed_at = ? WHERE owner_id = ? AND order_id = ?')
			.bind(Date.parse('2025-05-12T03:00:00Z'), a.ownerId, order.orderId)
			.run();
		const month = date.slice(0, 7);
		const totals = {
			ordersThisMonth: 0,
			revenueThisMonth: 0,
			previousRevenue: 0,
			repeatOrdersThisMonth: 0,
			convertedOrdersThisMonth: 0,
			contactsThisMonth: 0
		};
		const statsA = await getInsights(a, date, month);
		expect(statsA).toMatchObject({
			ordersThisMonth: 1,
			revenueThisMonth: 85000,
			previousRevenue: 110,
			repeatOrdersThisMonth: 1,
			convertedOrdersThisMonth: 1,
			contactsThisMonth: 1,
			outcomesThisMonth: { ordered: 1 },
			repeatCustomerRate: 1
		});
		const statsB = await getInsights(b, date, month);
		expect(statsB).toMatchObject({
			...totals,
			repeatCustomerRate: null,
			customersByStatus: { active: 0, lead: 0, dormant: 0 }
		});
		expect(Object.values(statsB.outcomesThisMonth)).toEqual([0, 0, 0, 0, 0]);
		expect(statsB.last6Months.every(({ revenue, orders }) => revenue === 0 && orders === 0)).toBe(
			true
		);
		expect(statsB.dailyRevenue.every(({ revenue }) => revenue === 0)).toBe(true);
		expect(await listOrders(b, { month })).toMatchObject({ items: [], count: 0, revenue: 0 });
		for (const q of [phone, 'A private']) {
			const result = await invoke(picker, b, {
				path: `/orders/new/customers?q=${encodeURIComponent(q)}`
			});
			expect(await result.json()).toEqual({ items: [], more: false });
		}
		const result = await invoke(picker, a, { path: `/orders/new/customers?q=${phone}` });
		expect(await result.json()).toEqual({
			items: [{ id: ca.id, name: customerInput.name, phone, dosePerDay: 1, lastOrderDate: date }],
			more: false
		});
		expect(await invoke(newOrder, b, { path: `/orders/new?customer=${ca.id}` })).toMatchObject({
			preselected: null
		});
		await expect(invoke(detail, b, { id: ca.id })).rejects.toMatchObject({ status: 404 });
		await expect(invoke(edit, b, { id: ca.id })).rejects.toMatchObject({ status: 404 });
		expect(await invoke(detail, a, { id: ca.id })).toMatchObject({
			customer: { id: ca.id },
			orders: expect.arrayContaining([
				expect.objectContaining({ id: order.orderId, productName: 'ROOVE' })
			]),
			activities: expect.arrayContaining([
				expect.objectContaining({
					type: 'note',
					body: 'A-only note',
					actorName: a.ownerId,
					createdAt: expect.any(Date)
				})
			])
		});
		expect(await invoke(customers, b)).toMatchObject({
			items: [],
			total: 0,
			counts: { all: 0, active: 0, lead: 0, dormant: 0, interested: 0 }
		});
		expect(await invoke(queue, b)).toMatchObject({
			hasCustomers: false,
			doneToday: 0,
			handled: [],
			overdue: [],
			dueToday: [],
			waiting: [],
			upcoming: []
		});
		expect(await invoke(layout, b)).toMatchObject({ queueCount: 0 });
		const queueA = await invoke(queue, a);
		expect(queueA).toMatchObject({
			hasCustomers: true,
			doneToday: 1,
			handled: [{ customerId: ca.id }],
			overdue: [
				{
					customer: { id: ca.id },
					waUrl: expect.stringContaining(`https://wa.me/${phone}`)
				}
			]
		});
		const cb = await addCustomer(b, { ...customerInput, name: 'B only' });
		await createOrder(b, {
			...orderInput,
			totalPaid: 912,
			customerId: cb.id,
			productId: `prod_roove:${b.ownerId}`
		});
		expect(await listOrders(b, { month })).toMatchObject({
			count: 1,
			revenue: 912,
			items: [{ customerId: cb.id }]
		});
		expect(await invoke(customers, b)).toMatchObject({
			total: 1,
			counts: { active: 1, all: 1 },
			items: [{ id: cb.id }]
		});
		expect(await getInsights(b, date, month)).toMatchObject({
			...totals,
			ordersThisMonth: 1,
			revenueThisMonth: 912,
			repeatCustomerRate: 0,
			dailyRevenue: expect.arrayContaining([{ date, revenue: 912 }]),
			last6Months: expect.arrayContaining([{ month, revenue: 912, orders: 1 }])
		});
		await d1
			.prepare("UPDATE follow_up SET contacted_at = ? WHERE status = 'open' AND owner_id IN (?, ?)")
			.bind(Date.parse('2025-05-10T03:00:00Z'), a.ownerId, b.ownerId)
			.run();
		await updateRules(b, { ...defaults, retryDays: 4 });
		expect(await queueCount(a, date)).toBe(1);
		expect(await queueCount(b, date)).toBe(0);
	});

	it('rejects foreign actions and mixed undo ids without affecting either customer', async () => {
		const a = await account('actions-a');
		const b = await account('actions-b');
		const ca = await addCustomer(a, customerInput, today);
		const cb = await addCustomer(b, customerInput, today);
		const foreign = { id: ca.id };
		const dueDate = addDays(today, 3);
		const order = await createOrder(a, {
			...orderInput,
			customerId: ca.id,
			productId: `prod_roove:${a.ownerId}`
		});
		const aBefore = await getCustomerDetail(a, ca.id);
		const aOpen = aBefore!.openFollowUp!.id;
		const aSnooze = await snooze(a, aOpen, dueDate, today);
		if (!aSnooze.ok) throw new Error('Invalid snooze fixture');
		const aSent = await markSent(a, aOpen, 'A');
		const aProtected = await getCustomerDetail(a, ca.id);
		const bProtected = await getCustomerDetail(b, cb.id);
		for (const run of [
			() =>
				invoke(editActions.update, b, { ...foreign, fields: { ...customerInput, dosePreset: 1 } }),
			() => invoke(editActions.delete, b, foreign),
			() => invoke(detailActions.note, b, { ...foreign, fields: { body: 'not yours' } }),
			() =>
				invoke(detailActions.deleteOrder, b, { ...foreign, fields: { orderId: order.orderId } }),
			() => invoke(detailActions.deleteOrder, a, { id: cb.id, fields: { orderId: order.orderId } }),
			() => invoke(queueActions.schedule, b, { fields: { customerId: ca.id, dueDate } }),
			() =>
				invoke(orderActions.default, b, {
					fields: { ...orderInput, customerId: ca.id, productId: `prod_roove:${b.ownerId}` }
				}),
			() =>
				invoke(orderActions.default, b, {
					fields: { ...orderInput, customerId: cb.id, productId: `prod_roove:${a.ownerId}` }
				}),
			() =>
				invoke(settingsActions.updateProduct, b, {
					fields: { productId: `prod_roove:${a.ownerId}` }
				}),
			() => invoke(queueActions.sent, b, { fields: { followUpId: aOpen } }),
			() => invoke(queueActions.resend, b, { fields: { followUpId: aOpen, body: 'not yours' } }),
			() => invoke(queueActions.outcome, b, { fields: { followUpId: aOpen, outcome: 'no_reply' } }),
			() => invoke(queueActions.snooze, b, { fields: { followUpId: aOpen, dueDate } }),
			() => invoke(queueActions.undoSent, b, { fields: { ...aSent } }),
			() => invoke(queueActions.undoSnooze, b, { fields: { ...aSnooze.undo } })
		])
			await expect(run()).rejects.toMatchObject({ status: 404 });
		expect(await invoke(queueActions.undoResend, b, { fields: { ...aSent } })).toMatchObject({
			status: 409
		});
		expect(
			await invoke(queueActions.undoOutcome, b, {
				fields: { followUpId: ca.followUpId, activityId: aSent.activityId }
			})
		).toMatchObject({ status: 409 });
		expect(await getCustomerDetail(a, ca.id)).toEqual(aProtected);
		expect(await getCustomerDetail(b, cb.id)).toEqual(bProtected);

		// Same-owner wrong customer, not just a foreign route id.
		const other = await addCustomer(a, { ...customerInput, phone: '628123456781' });
		await expect(
			invoke(detailActions.deleteOrder, a, { id: other.id, fields: { orderId: order.orderId } })
		).rejects.toMatchObject({ status: 404 });
		const sent = await invoke(queueActions.sent, b, { fields: { followUpId: cb.followUpId } });
		expect(sent).toMatchObject({ ok: true, action: 'sent' });
		const bSnooze = await snooze(b, cb.followUpId, dueDate, today);
		if (!bSnooze.ok) throw new Error('Invalid snooze fixture');
		const mixedState = await getCustomerDetail(b, cb.id);
		for (const id of [aSnooze.undo.activityId, sent?.undo?.activityId]) {
			expect(
				await invoke(queueActions.undoSnooze, b, {
					fields: { ...bSnooze.undo, activityId: String(id) }
				})
			).toMatchObject({ status: 409 });
		}
		expect(
			await invoke(queueActions.undoSent, b, {
				fields: { followUpId: cb.followUpId, activityId: bSnooze.undo.activityId }
			})
		).toMatchObject({ status: 409 });
		expect(
			await invoke(queueActions.undoSent, b, {
				fields: { followUpId: cb.followUpId, activityId: aSent.activityId }
			})
		).toMatchObject({ status: 409 });
		expect(await getCustomerDetail(b, cb.id)).toEqual(mixedState);
		expect(await invoke(queueActions.undoSnooze, b, { fields: { ...bSnooze.undo } })).toMatchObject(
			{ ok: true, action: 'undoSnooze' }
		);
		expect(
			await invoke(queueActions.undoSent, b, {
				fields: { followUpId: cb.followUpId, activityId: String(sent?.undo?.activityId) }
			})
		).toMatchObject({ ok: true, action: 'undoSent' });
		const aOutcome = await recordOutcome(
			a,
			aOpen,
			{ outcome: 'no_reply', note: null, nextDate: null },
			today
		);
		if (!aOutcome.ok) throw new Error('Invalid outcome fixture');
		const outcome = await invoke(queueActions.outcome, b, {
			fields: { followUpId: cb.followUpId, outcome: 'no_reply' }
		});
		expect(outcome).toMatchObject({ ok: true, action: 'outcome', nextDate: addDays(today, 2) });
		const undo = {
			followUpId: cb.followUpId,
			activityId: String(outcome?.undo?.activityId),
			nextFollowUpId: String(outcome?.undo?.nextFollowUpId)
		};
		const outcomeState = await getCustomerDetail(b, cb.id);
		expect(
			await invoke(queueActions.undoOutcome, b, {
				fields: { ...undo, nextFollowUpId: aOutcome.undo.nextFollowUpId }
			})
		).toMatchObject({ status: 409 });
		expect(
			await invoke(queueActions.undoOutcome, b, {
				fields: { ...undo, activityId: aOutcome.undo.activityId }
			})
		).toMatchObject({ status: 409 });
		expect(await getCustomerDetail(b, cb.id)).toEqual(outcomeState);
		const resend = await invoke(queueActions.resend, b, {
			fields: { followUpId: cb.followUpId, body: 'Repeat message' }
		});
		expect(resend).toMatchObject({ ok: true, action: 'resend' });
		expect(
			await invoke(queueActions.undoResend, b, {
				fields: { followUpId: cb.followUpId, activityId: String(resend?.undo?.activityId) }
			})
		).toMatchObject({ ok: true, action: 'undoResend' });
		expect(await invoke(queueActions.undoOutcome, b, { fields: undo })).toMatchObject({
			ok: true,
			action: 'undoOutcome'
		});
		expect(await getCustomerDetail(b, cb.id)).toEqual(bProtected);
		expect(
			await invoke(queueActions.snooze, b, { fields: { followUpId: cb.followUpId, dueDate } })
		).toMatchObject({ ok: true, action: 'snooze' });
		expect(
			await invoke(detailActions.note, b, { id: cb.id, fields: { body: 'Own note' } })
		).toMatchObject({ ok: true, action: 'note' });
		await expect(
			invoke(orderActions.default, b, {
				fields: {
					...orderInput,
					orderDate: today,
					customerId: cb.id,
					productId: `prod_roove:${b.ownerId}`
				}
			})
		).rejects.toMatchObject({ status: 303 });
		expect(await getCustomerDetail(b, cb.id)).toMatchObject({
			openFollowUp: { dueDate: addDays(today, 5), kind: 'reorder' },
			orders: [{ totalPaid: 85000 }]
		});
		const unscheduled = await addCustomer(b, { ...customerInput, phone: '628123456782' });
		await d1
			.prepare('DELETE FROM follow_up WHERE owner_id = ? AND id = ?')
			.bind(b.ownerId, unscheduled.followUpId)
			.run();
		expect(
			await invoke(queueActions.schedule, b, { fields: { customerId: unscheduled.id, dueDate } })
		).toMatchObject({ ok: true, action: 'schedule' });
		expect(await getCustomerDetail(b, unscheduled.id)).toMatchObject({
			openFollowUp: { dueDate, kind: 'lead' }
		});
	});

	it('imports phones owned by someone else using only local products and rules', async () => {
		const a = await account('import-a');
		const b = await account('import-b');
		const ca = await addCustomer(a);
		await updateRules(b, { ...defaults, leadDays: 7 });
		await updateProduct(b, `prod_roove:${b.ownerId}`, { ...productInput, name: 'Local default' });
		const before = await getCustomerDetail(a, ca.id);
		expect(await invoke(importPreview, a)).toMatchObject({ existingPhones: [phone] });
		expect(await invoke(importPreview, b)).toMatchObject({ existingPhones: [] });
		const rows = [
			{
				name: 'Imported B customer',
				phone,
				productName: null,
				qty: 30,
				dosePerDay: 1,
				lastOrderDate: today,
				lastAction: null,
				notes: null
			}
		];
		const form = { fields: { rows: JSON.stringify(rows) } };
		expect(await invoke(importActions.default, b, form)).toMatchObject({
			ok: true,
			imported: 1,
			skippedExisting: 0
		});
		const imported = await findByPhone(b, phone);
		expect(await getCustomerDetail(b, imported?.id ?? '')).toMatchObject({
			customer: { name: 'Imported B customer' },
			openFollowUp: { dueDate: addDays(today, 23) },
			lastOrder: { productName: 'Local default' }
		});
		expect(await invoke(importActions.default, b, form)).toMatchObject({
			status: 400,
			data: { empty: true }
		});
		expect(await getCustomerDetail(a, ca.id)).toEqual(before);
	});
});
