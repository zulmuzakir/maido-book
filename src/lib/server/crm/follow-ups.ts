import { and, asc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { owned, type CrmScope } from './scope.ts';
import {
	activity,
	customer,
	customerOrder,
	followUp,
	product,
	setting
} from '#lib/server/db/schema.ts';
import { addDays } from '#lib/domain/dates.ts';
import { pickHandled, type HandledOutcome } from '#lib/domain/handled.ts';
import { planAfterOutcome, queueBucket, type QueueBucket } from '#lib/domain/follow-up.ts';
import { renderTemplate, type TemplateVars } from '#lib/domain/template.ts';
import type { CustomerStatus, FollowUpKind, ManualOutcome } from '#lib/domain/types.ts';
import { batchSafe, runBatch, type Stmt } from './batch.ts';
import { latestOrderOn, productOrderOn, toLastOrder, type LastOrder } from './customers.ts';
import { getRules, templatesQuery } from './settings.ts';

const jakartaMidnight = (iso: string) => new Date(Date.parse(iso + 'T00:00:00+07:00'));

export interface QueueItem {
	followUpId: string;
	kind: FollowUpKind;
	dueDate: string;
	attempt: number;
	contactedAt: Date | null;
	customer: { id: string; name: string; phone: string; dosePerDay: number; status: CustomerStatus };
	lastOrder: LastOrder | null;
}

/** Open follow-ups due within a week, or sent and waiting, with customer and latest order. */
export const queueQuery = (crm: CrmScope, today: string) =>
	crm.db
		.select(
			batchSafe({
				followUpId: followUp.id,
				kind: followUp.kind,
				dueDate: followUp.dueDate,
				attempt: followUp.attempt,
				contactedAt: followUp.contactedAt,
				cId: customer.id,
				cName: customer.name,
				cPhone: customer.phone,
				cDose: customer.dosePerDay,
				cStatus: customer.status,
				oDate: customerOrder.orderDate,
				oQty: customerOrder.qty,
				oDays: customerOrder.daysSupply,
				pName: product.name,
				pUnit: product.unitLabel
			})
		)
		.from(followUp)
		.innerJoin(
			customer,
			and(eq(customer.ownerId, followUp.ownerId), eq(customer.id, followUp.customerId))
		)
		.leftJoin(customerOrder, latestOrderOn)
		.leftJoin(product, productOrderOn)
		.where(
			owned(
				crm,
				followUp.ownerId,
				eq(followUp.status, 'open'),
				or(lte(followUp.dueDate, addDays(today, 7)), isNotNull(followUp.contactedAt))
			)
		);

export function toQueue(
	rows: Awaited<ReturnType<typeof queueQuery>>,
	today: string
): Record<QueueBucket, QueueItem[]> {
	const out: Record<QueueBucket, QueueItem[]> = {
		overdue: [],
		today: [],
		waiting: [],
		upcoming: []
	};
	for (const r of rows) {
		const item: QueueItem = {
			followUpId: r.followUpId,
			kind: r.kind,
			dueDate: r.dueDate,
			attempt: r.attempt,
			contactedAt: r.contactedAt,
			customer: {
				id: r.cId,
				name: r.cName,
				phone: r.cPhone,
				dosePerDay: r.cDose,
				status: r.cStatus
			},
			lastOrder: toLastOrder({
				orderDate: r.oDate,
				qty: r.oQty,
				daysSupply: r.oDays,
				productName: r.pName,
				unitLabel: r.pUnit
			})
		};
		out[queueBucket(item, today)].push(item);
	}
	out.overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
	out.today.sort((a, b) => a.customer.name.localeCompare(b.customer.name));
	out.waiting.sort((a, b) => a.contactedAt!.getTime() - b.contactedAt!.getTime());
	out.upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
	return out;
}

/**
 * The queue's "Perlu dihubungi" count: follow-ups due today or earlier and not yet sent (win-backs
 * wait in their own fold), plus messages left without a reply for `retryDays` calendar days.
 * One query: `retryDays` is read from the setting row inside it.
 */
export async function queueCount(crm: CrmScope, today: string): Promise<number> {
	// A message sent on or before Jakarta day `today + 1 - retryDays` has waited `retryDays` days by
	// today. unixepoch(today) is UTC midnight; 25200 s earlier is Jakarta midnight.
	const staleBefore = sql`(unixepoch(${today}) + (1 - (select ${setting.retryDays} from ${setting} where ${setting.ownerId} = ${crm.ownerId})) * 86400 - 25200) * 1000`;
	const row = await crm.db
		.select({ n: sql<number>`count(*)` })
		.from(followUp)
		.where(
			owned(
				crm,
				followUp.ownerId,
				eq(followUp.status, 'open'),
				or(
					and(
						isNull(followUp.contactedAt),
						lte(followUp.dueDate, today),
						ne(followUp.kind, 'winback')
					),
					sql`${followUp.contactedAt} < ${staleBefore}`
				)
			)
		)
		.get();
	return row?.n ?? 0;
}

export interface HandledItem {
	id: string;
	customerId: string;
	name: string;
	outcome: HandledOutcome;
	lastOrder: LastOrder | null;
}

/**
 * Who was dealt with since Jakarta midnight, newest first, one row per customer: the queue's
 * "Dihubungi hari ini" list. Plain sends count too ("contacted"); an outcome or order logged the
 * same day says more and wins (see `pickHandled`).
 */
export const handledQuery = (crm: CrmScope, today: string) =>
	crm.db
		.select(
			batchSafe({
				id: activity.id,
				customerId: activity.customerId,
				name: customer.name,
				type: activity.type,
				outcome: activity.outcome,
				oDate: customerOrder.orderDate,
				oQty: customerOrder.qty,
				oDays: customerOrder.daysSupply,
				pName: product.name,
				pUnit: product.unitLabel
			})
		)
		.from(activity)
		.innerJoin(
			customer,
			and(eq(customer.ownerId, activity.ownerId), eq(customer.id, activity.customerId))
		)
		.leftJoin(customerOrder, latestOrderOn)
		.leftJoin(product, productOrderOn)
		.where(
			owned(
				crm,
				activity.ownerId,
				inArray(activity.type, ['outcome', 'order', 'wa_sent']),
				gte(activity.createdAt, jakartaMidnight(today))
			)
		)
		.orderBy(sql`${activity.createdAt} desc`)
		.limit(300);

export function toHandled(rows: Awaited<ReturnType<typeof handledQuery>>): HandledItem[] {
	return pickHandled(
		rows.map((r) => ({ ...r, type: r.type as 'outcome' | 'order' | 'wa_sent' }))
	).map((r) => ({
		id: String(r.id),
		customerId: r.customerId,
		name: r.name,
		outcome: r.result,
		lastOrder: toLastOrder({
			orderDate: r.oDate,
			qty: r.oQty,
			daysSupply: r.oDays,
			productName: r.pName,
			unitLabel: r.pUnit
		})
	}));
}

/**
 * Customers who left the day's work since Jakarta midnight of `today`: messaged, given an outcome,
 * snoozed or ordered. Each counts once, so a resend or a second tap does not move the progress, and
 * a customer closed without a message still counts as done.
 */
export const doneTodayQuery = (crm: CrmScope, today: string) =>
	crm.db
		.select({ n: sql<number>`count(distinct ${activity.customerId})` })
		.from(activity)
		.where(
			owned(
				crm,
				activity.ownerId,
				inArray(activity.type, ['wa_sent', 'outcome', 'snooze', 'order']),
				gte(activity.createdAt, jakartaMidnight(today))
			)
		);

export const csFirstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

/** The first active product: the `{produk}` fallback for customers without an order. */
export const defaultProductQuery = (crm: CrmScope) =>
	crm.db
		.select({ name: product.name })
		.from(product)
		.where(owned(crm, product.ownerId, eq(product.active, true)))
		.orderBy(asc(product.createdAt))
		.limit(1);

/** Templates + default product name, loaded once and reused for many rows. */
export function toMessageContext(
	templates: { kind: string; body: string }[],
	firstProduct: { name: string }[]
) {
	return {
		templates: Object.fromEntries(templates.map((t) => [t.kind, t.body])) as Record<string, string>,
		defaultProduct: firstProduct[0]?.name ?? ''
	};
}

export async function messageContext(crm: CrmScope) {
	const [templates, firstProduct] = await crm.db.batch([
		templatesQuery(crm),
		defaultProductQuery(crm)
	]);
	return toMessageContext(templates, firstProduct);
}
export type MessageContext = ReturnType<typeof toMessageContext>;

export function templateVars(
	ctx: MessageContext,
	customer: { name: string },
	lastOrder: { productName: string } | null,
	csName: string
): TemplateVars {
	return {
		nama: customer.name,
		produk: lastOrder?.productName ?? ctx.defaultProduct,
		cs: csFirstName(csName)
	};
}

export function messageFor(
	ctx: MessageContext,
	followUp: { kind: FollowUpKind },
	customer: { name: string },
	lastOrder: { productName: string } | null,
	csName: string
): string {
	return renderTemplate(
		ctx.templates[followUp.kind] ?? '',
		templateVars(ctx, customer, lastOrder, csName)
	);
}

async function getOpen(crm: CrmScope, followUpId: string) {
	const row = await crm.db
		.select()
		.from(followUp)
		.where(owned(crm, followUp.ownerId, eq(followUp.id, followUpId), eq(followUp.status, 'open')))
		.get();
	if (!row) error(404);
	return row;
}

/** Logs the exact message the UI opened in WhatsApp. */
export async function markSent(
	crm: CrmScope,
	followUpId: string,
	csName: string,
	body?: string | null
) {
	const { db, ownerId } = crm;
	const fu = await getOpen(crm, followUpId);
	const [cust, last, ctx] = await Promise.all([
		db
			.select()
			.from(customer)
			.where(owned(crm, customer.ownerId, eq(customer.id, fu.customerId)))
			.get(),
		db
			.select({ productName: product.name })
			.from(customerOrder)
			.innerJoin(product, productOrderOn)
			.where(owned(crm, customerOrder.ownerId, eq(customerOrder.customerId, fu.customerId)))
			.orderBy(sql`${customerOrder.orderDate} desc, ${customerOrder.createdAt} desc`)
			.limit(1)
			.get(),
		messageContext(crm)
	]);
	if (!cust) error(404);
	const activityId = crypto.randomUUID();
	await runBatch(db, [
		db
			.update(followUp)
			.set({ contactedAt: new Date() })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id))),
		db.insert(activity).values({
			id: activityId,
			ownerId,
			customerId: fu.customerId,
			type: 'wa_sent',
			body: body ?? messageFor(ctx, fu, cust, last ?? null, csName),
			followUpId: fu.id,
			userId: ownerId
		})
	]);
	const undo: SentUndo = {
		followUpId: fu.id,
		activityId,
		previousContactedAt: fu.contactedAt ? fu.contactedAt.getTime() : null
	};
	return undo;
}

/** What the client sends back to reverse a send that was logged by mistake. */
export interface SentUndo {
	followUpId: string;
	activityId: string;
	/** Epoch ms of the earlier send when this was a resend; null when it was the first send. */
	previousContactedAt: number | null;
}

/** Removes the logged send and puts the follow-up back where it was, if it is still open. */
export async function undoSent(crm: CrmScope, u: SentUndo): Promise<{ ok: boolean }> {
	const { db } = crm;
	const fu = await getOpen(crm, u.followUpId);
	const logged = await db
		.select({ id: activity.id })
		.from(activity)
		.where(
			owned(
				crm,
				activity.ownerId,
				eq(activity.id, u.activityId),
				eq(activity.followUpId, fu.id),
				eq(activity.type, 'wa_sent')
			)
		)
		.get();
	if (!logged) return { ok: false };
	await runBatch(db, [
		db
			.update(followUp)
			.set({ contactedAt: u.previousContactedAt === null ? null : new Date(u.previousContactedAt) })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id))),
		db.delete(activity).where(owned(crm, activity.ownerId, eq(activity.id, logged.id)))
	]);
	return { ok: true };
}

/** Logs a re-sent message for a follow-up already closed, used by the queue's saved state. */
export async function logResend(
	crm: CrmScope,
	followUpId: string,
	body: string
): Promise<ResendUndo> {
	const { db, ownerId } = crm;
	const fu = await db
		.select()
		.from(followUp)
		.where(owned(crm, followUp.ownerId, eq(followUp.id, followUpId)))
		.get();
	if (!fu) error(404);
	const activityId = crypto.randomUUID();
	await db.insert(activity).values({
		id: activityId,
		ownerId,
		customerId: fu.customerId,
		type: 'wa_sent',
		body,
		followUpId: fu.id,
		userId: ownerId
	});
	return { followUpId: fu.id, activityId };
}

/** What the client sends back to take a re-sent message out of the log. */
export interface ResendUndo {
	followUpId: string;
	activityId: string;
}

/** Removes a logged resend. The follow-up itself is closed, so only the log entry changes. */
export async function undoResend(crm: CrmScope, u: ResendUndo): Promise<{ ok: boolean }> {
	const removed = await crm.db
		.delete(activity)
		.where(
			owned(
				crm,
				activity.ownerId,
				eq(activity.id, u.activityId),
				eq(activity.followUpId, u.followUpId),
				eq(activity.type, 'wa_sent')
			)
		)
		.returning({ id: activity.id });
	return { ok: removed.length > 0 };
}

/** What the client sends back to reverse a just-saved outcome. */
export interface OutcomeUndo {
	followUpId: string;
	activityId: string;
	/** The follow-up the outcome scheduled, if any. */
	nextFollowUpId: string | null;
	/** The customer's status before the outcome, only when the outcome changed it. */
	previousStatus: CustomerStatus | null;
}

export interface SnoozeUndo {
	followUpId: string;
	activityId: string;
	dueDate: string;
	previousDueDate: string;
}

export async function recordOutcome(
	crm: CrmScope,
	followUpId: string,
	input: {
		outcome: ManualOutcome;
		nextDate: string | null;
		note: string | null;
	},
	today: string
): Promise<
	| { ok: true; nextDate: string | null; undo: OutcomeUndo }
	| { ok: false; errors: Record<string, string> }
> {
	const { db, ownerId } = crm;
	const fu = await getOpen(crm, followUpId);
	if (input.nextDate && input.nextDate < addDays(today, 1))
		return { ok: false, errors: { nextDate: 'out_of_range' } };
	const [rules, cust] = await Promise.all([
		getRules(crm),
		db
			.select({ status: customer.status })
			.from(customer)
			.where(owned(crm, customer.ownerId, eq(customer.id, fu.customerId)))
			.get()
	]);
	const plan = planAfterOutcome({
		outcome: input.outcome,
		kind: fu.kind,
		attempt: fu.attempt,
		today,
		nextDate: input.nextDate ?? undefined,
		rules
	});
	const activityId = crypto.randomUUID();
	const nextFollowUpId = plan.next ? crypto.randomUUID() : null;
	const stmts: Stmt[] = [
		db
			.update(followUp)
			.set({ status: 'done', outcome: input.outcome, completedAt: new Date() })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id))),
		db.insert(activity).values({
			id: activityId,
			ownerId,
			customerId: fu.customerId,
			type: 'outcome',
			outcome: input.outcome,
			body: input.note,
			followUpId: fu.id,
			userId: ownerId
		})
	];
	if (plan.customerStatus)
		stmts.push(
			db
				.update(customer)
				.set({ status: plan.customerStatus })
				.where(owned(crm, customer.ownerId, eq(customer.id, fu.customerId)))
		);
	if (plan.next && nextFollowUpId)
		stmts.push(
			db.insert(followUp).values({
				id: nextFollowUpId,
				ownerId,
				customerId: fu.customerId,
				kind: plan.next.kind,
				dueDate: plan.next.dueDate,
				attempt: plan.next.attempt
			})
		);
	await runBatch(db, stmts);
	return {
		ok: true,
		nextDate: plan.next?.dueDate ?? null,
		undo: {
			followUpId: fu.id,
			activityId,
			nextFollowUpId,
			previousStatus: plan.customerStatus && cust ? cust.status : null
		}
	};
}

/**
 * Reopens a follow-up closed by `recordOutcome`. Refuses when the follow-up it scheduled has since
 * been contacted or closed, because undoing then would erase real work.
 */
export async function undoOutcome(crm: CrmScope, u: OutcomeUndo): Promise<{ ok: boolean }> {
	const { db } = crm;
	const fu = await db
		.select()
		.from(followUp)
		.where(owned(crm, followUp.ownerId, eq(followUp.id, u.followUpId), eq(followUp.status, 'done')))
		.get();
	// Only a manual outcome logged here can be undone, never a follow-up closed by an order.
	if (!fu || fu.outcome === 'ordered' || fu.orderId) return { ok: false };
	const logged = await db
		.select({ id: activity.id })
		.from(activity)
		.where(
			owned(
				crm,
				activity.ownerId,
				eq(activity.id, u.activityId),
				eq(activity.followUpId, fu.id),
				eq(activity.type, 'outcome')
			)
		)
		.get();
	if (!logged) return { ok: false };
	if (u.nextFollowUpId) {
		const next = await db
			.select({ id: followUp.id })
			.from(followUp)
			.where(
				owned(
					crm,
					followUp.ownerId,
					eq(followUp.id, u.nextFollowUpId),
					eq(followUp.customerId, fu.customerId),
					eq(followUp.status, 'open'),
					isNull(followUp.contactedAt)
				)
			)
			.get();
		if (!next) return { ok: false };
		const touched = await db
			.select({ id: activity.id })
			.from(activity)
			.where(owned(crm, activity.ownerId, eq(activity.followUpId, u.nextFollowUpId)))
			.get();
		if (touched) return { ok: false };
	} else {
		// Nothing to delete, so any other open follow-up would collide with the reopened one.
		const other = await db
			.select({ id: followUp.id })
			.from(followUp)
			.where(
				owned(
					crm,
					followUp.ownerId,
					eq(followUp.customerId, fu.customerId),
					eq(followUp.status, 'open')
				)
			)
			.get();
		if (other) return { ok: false };
	}
	// One open follow-up per customer: the scheduled one must go before the original reopens.
	const stmts: Stmt[] = [];
	if (u.nextFollowUpId)
		stmts.push(
			db.delete(followUp).where(owned(crm, followUp.ownerId, eq(followUp.id, u.nextFollowUpId)))
		);
	stmts.push(
		db
			.update(followUp)
			.set({ status: 'open', outcome: null, completedAt: null })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id))),
		db.delete(activity).where(owned(crm, activity.ownerId, eq(activity.id, u.activityId)))
	);
	// Only undo the dormant status this outcome set; a later order may have reactivated them.
	if (u.previousStatus)
		stmts.push(
			db
				.update(customer)
				.set({ status: u.previousStatus })
				.where(
					owned(
						crm,
						customer.ownerId,
						eq(customer.id, fu.customerId),
						eq(customer.status, 'dormant')
					)
				)
		);
	await runBatch(db, stmts);
	return { ok: true };
}

export async function snooze(
	crm: CrmScope,
	followUpId: string,
	dueDate: string,
	today: string
): Promise<{ ok: true; undo: SnoozeUndo } | { ok: false; errors: Record<string, string> }> {
	const { db, ownerId } = crm;
	const fu = await getOpen(crm, followUpId);
	if (dueDate < addDays(today, 1)) return { ok: false, errors: { dueDate: 'out_of_range' } };
	const activityId = crypto.randomUUID();
	await runBatch(db, [
		db
			.update(followUp)
			.set({ dueDate })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id))),
		db.insert(activity).values({
			id: activityId,
			ownerId,
			customerId: fu.customerId,
			type: 'snooze',
			body: dueDate,
			followUpId: fu.id,
			userId: ownerId
		})
	]);
	return {
		ok: true,
		undo: { followUpId: fu.id, activityId, dueDate, previousDueDate: fu.dueDate }
	};
}

/** Restores the old date only while the snooze being undone is still the current one. */
export async function undoSnooze(crm: CrmScope, u: SnoozeUndo): Promise<{ ok: boolean }> {
	const { db } = crm;
	const fu = await getOpen(crm, u.followUpId);
	if (fu.dueDate !== u.dueDate) return { ok: false };
	const logged = owned(
		crm,
		activity.ownerId,
		eq(activity.id, u.activityId),
		eq(activity.followUpId, fu.id),
		eq(activity.type, 'snooze'),
		eq(activity.body, u.dueDate)
	);
	if (!(await db.select({ id: activity.id }).from(activity).where(logged).get()))
		return { ok: false };
	await runBatch(db, [
		db
			.update(followUp)
			.set({ dueDate: u.previousDueDate })
			.where(owned(crm, followUp.ownerId, eq(followUp.id, fu.id), eq(followUp.dueDate, u.dueDate))),
		db.delete(activity).where(logged)
	]);
	return { ok: true };
}

export async function schedule(
	crm: CrmScope,
	customerId: string,
	dueDate: string,
	today: string
): Promise<{ ok: true } | { ok: false; status: 409 | 400; errors: Record<string, string> }> {
	const { db, ownerId } = crm;
	const cust = await db
		.select()
		.from(customer)
		.where(owned(crm, customer.ownerId, eq(customer.id, customerId)))
		.get();
	if (!cust) error(404);
	if (dueDate < today) return { ok: false, status: 400, errors: { dueDate: 'out_of_range' } };
	const open = await db
		.select({ id: followUp.id })
		.from(followUp)
		.where(
			owned(crm, followUp.ownerId, eq(followUp.customerId, customerId), eq(followUp.status, 'open'))
		)
		.get();
	if (open) return { ok: false, status: 409, errors: {} };
	const id = crypto.randomUUID();
	await runBatch(db, [
		db.insert(followUp).values({
			id,
			ownerId,
			customerId,
			kind: cust.status === 'lead' ? 'lead' : 'retry',
			dueDate,
			attempt: 1
		}),
		db.insert(activity).values({
			ownerId,
			customerId,
			type: 'scheduled',
			body: dueDate,
			followUpId: id,
			userId: ownerId
		})
	]);
	return { ok: true };
}
