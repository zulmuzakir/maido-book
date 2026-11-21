import { and, asc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { Db } from '#lib/server/db/index.ts';
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
import { latestOrderOn, toLastOrder, type LastOrder } from './customers.ts';
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
export const queueQuery = (db: Db, today: string) =>
	db
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
		.innerJoin(customer, eq(customer.id, followUp.customerId))
		.leftJoin(customerOrder, latestOrderOn)
		.leftJoin(product, eq(product.id, customerOrder.productId))
		.where(
			and(
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
export async function queueCount(db: Db, today: string): Promise<number> {
	// A message sent on or before Jakarta day `today + 1 - retryDays` has waited `retryDays` days by
	// today. unixepoch(today) is UTC midnight; 25200 s earlier is Jakarta midnight.
	const staleBefore = sql`(unixepoch(${today}) + (1 - (select ${setting.retryDays} from ${setting} where ${setting.id} = 1)) * 86400 - 25200) * 1000`;
	const row = await db
		.select({ n: sql<number>`count(*)` })
		.from(followUp)
		.where(
			and(
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
export const handledQuery = (db: Db, today: string) =>
	db
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
		.innerJoin(customer, eq(customer.id, activity.customerId))
		.leftJoin(customerOrder, latestOrderOn)
		.leftJoin(product, eq(product.id, customerOrder.productId))
		.where(
			and(
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
export const doneTodayQuery = (db: Db, today: string) =>
	db
		.select({ n: sql<number>`count(distinct ${activity.customerId})` })
		.from(activity)
		.where(
			and(
				inArray(activity.type, ['wa_sent', 'outcome', 'snooze', 'order']),
				gte(activity.createdAt, jakartaMidnight(today))
			)
		);

export const csFirstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';

/** The first active product: the `{produk}` fallback for customers without an order. */
export const defaultProductQuery = (db: Db) =>
	db
		.select({ name: product.name })
		.from(product)
		.where(eq(product.active, true))
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

export async function messageContext(db: Db) {
	const [templates, firstProduct] = await db.batch([templatesQuery(db), defaultProductQuery(db)]);
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

async function getOpen(db: Db, followUpId: string) {
	const row = await db
		.select()
		.from(followUp)
		.where(and(eq(followUp.id, followUpId), eq(followUp.status, 'open')))
		.get();
	if (!row) error(404);
	return row;
}

/** Logs the exact message the UI opened in WhatsApp. */
export async function markSent(
	db: Db,
	followUpId: string,
	userId: string,
	csName: string,
	body?: string | null
) {
	const fu = await getOpen(db, followUpId);
	const [cust, last, ctx] = await Promise.all([
		db.select().from(customer).where(eq(customer.id, fu.customerId)).get(),
		db
			.select({ productName: product.name })
			.from(customerOrder)
			.innerJoin(product, eq(product.id, customerOrder.productId))
			.where(eq(customerOrder.customerId, fu.customerId))
			.orderBy(sql`${customerOrder.orderDate} desc, ${customerOrder.createdAt} desc`)
			.limit(1)
			.get(),
		messageContext(db)
	]);
	if (!cust) error(404);
	const activityId = crypto.randomUUID();
	await runBatch(db, [
		db.update(followUp).set({ contactedAt: new Date() }).where(eq(followUp.id, fu.id)),
		db.insert(activity).values({
			id: activityId,
			customerId: fu.customerId,
			type: 'wa_sent',
			body: body ?? messageFor(ctx, fu, cust, last ?? null, csName),
			followUpId: fu.id,
			userId
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
export async function undoSent(db: Db, u: SentUndo): Promise<{ ok: boolean }> {
	const fu = await getOpen(db, u.followUpId);
	const logged = await db
		.select({ id: activity.id })
		.from(activity)
		.where(and(eq(activity.id, u.activityId), eq(activity.followUpId, fu.id)))
		.get();
	if (!logged) return { ok: false };
	await runBatch(db, [
		db
			.update(followUp)
			.set({ contactedAt: u.previousContactedAt === null ? null : new Date(u.previousContactedAt) })
			.where(eq(followUp.id, fu.id)),
		db.delete(activity).where(eq(activity.id, logged.id))
	]);
	return { ok: true };
}

/** Logs a re-sent message for a follow-up already closed, used by the queue's saved state. */
export async function logResend(
	db: Db,
	followUpId: string,
	userId: string,
	body: string
): Promise<ResendUndo> {
	const fu = await db.select().from(followUp).where(eq(followUp.id, followUpId)).get();
	if (!fu) error(404);
	const activityId = crypto.randomUUID();
	await db.insert(activity).values({
		id: activityId,
		customerId: fu.customerId,
		type: 'wa_sent',
		body,
		followUpId: fu.id,
		userId
	});
	return { followUpId: fu.id, activityId };
}

/** What the client sends back to take a re-sent message out of the log. */
export interface ResendUndo {
	followUpId: string;
	activityId: string;
}

/** Removes a logged resend. The follow-up itself is closed, so only the log entry changes. */
export async function undoResend(db: Db, u: ResendUndo): Promise<{ ok: boolean }> {
	const removed = await db
		.delete(activity)
		.where(
			and(
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
	db: Db,
	followUpId: string,
	input: {
		outcome: ManualOutcome;
		nextDate: string | null;
		note: string | null;
	},
	userId: string,
	today: string
): Promise<
	| { ok: true; nextDate: string | null; undo: OutcomeUndo }
	| { ok: false; errors: Record<string, string> }
> {
	const fu = await getOpen(db, followUpId);
	if (input.nextDate && input.nextDate < addDays(today, 1))
		return { ok: false, errors: { nextDate: 'out_of_range' } };
	const [rules, cust] = await Promise.all([
		getRules(db),
		db
			.select({ status: customer.status })
			.from(customer)
			.where(eq(customer.id, fu.customerId))
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
			.where(eq(followUp.id, fu.id)),
		db.insert(activity).values({
			id: activityId,
			customerId: fu.customerId,
			type: 'outcome',
			outcome: input.outcome,
			body: input.note,
			followUpId: fu.id,
			userId
		})
	];
	if (plan.customerStatus)
		stmts.push(
			db.update(customer).set({ status: plan.customerStatus }).where(eq(customer.id, fu.customerId))
		);
	if (plan.next && nextFollowUpId)
		stmts.push(
			db.insert(followUp).values({
				id: nextFollowUpId,
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
export async function undoOutcome(db: Db, u: OutcomeUndo): Promise<{ ok: boolean }> {
	const fu = await db
		.select()
		.from(followUp)
		.where(and(eq(followUp.id, u.followUpId), eq(followUp.status, 'done')))
		.get();
	// Only a manual outcome logged here can be undone, never a follow-up closed by an order.
	if (!fu || fu.outcome === 'ordered' || fu.orderId) return { ok: false };
	const logged = await db
		.select({ id: activity.id })
		.from(activity)
		.where(
			and(
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
				and(
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
			.where(eq(activity.followUpId, u.nextFollowUpId))
			.get();
		if (touched) return { ok: false };
	} else {
		// Nothing to delete, so any other open follow-up would collide with the reopened one.
		const other = await db
			.select({ id: followUp.id })
			.from(followUp)
			.where(and(eq(followUp.customerId, fu.customerId), eq(followUp.status, 'open')))
			.get();
		if (other) return { ok: false };
	}
	// One open follow-up per customer: the scheduled one must go before the original reopens.
	const stmts: Stmt[] = [];
	if (u.nextFollowUpId) stmts.push(db.delete(followUp).where(eq(followUp.id, u.nextFollowUpId)));
	stmts.push(
		db
			.update(followUp)
			.set({ status: 'open', outcome: null, completedAt: null })
			.where(eq(followUp.id, fu.id)),
		db.delete(activity).where(eq(activity.id, u.activityId))
	);
	// Only undo the dormant status this outcome set; a later order may have reactivated them.
	if (u.previousStatus)
		stmts.push(
			db
				.update(customer)
				.set({ status: u.previousStatus })
				.where(and(eq(customer.id, fu.customerId), eq(customer.status, 'dormant')))
		);
	await runBatch(db, stmts);
	return { ok: true };
}

export async function snooze(
	db: Db,
	followUpId: string,
	dueDate: string,
	userId: string,
	today: string
): Promise<{ ok: true; undo: SnoozeUndo } | { ok: false; errors: Record<string, string> }> {
	const fu = await getOpen(db, followUpId);
	if (dueDate < addDays(today, 1)) return { ok: false, errors: { dueDate: 'out_of_range' } };
	const activityId = crypto.randomUUID();
	await runBatch(db, [
		db.update(followUp).set({ dueDate }).where(eq(followUp.id, fu.id)),
		db.insert(activity).values({
			id: activityId,
			customerId: fu.customerId,
			type: 'snooze',
			body: dueDate,
			followUpId: fu.id,
			userId
		})
	]);
	return {
		ok: true,
		undo: { followUpId: fu.id, activityId, dueDate, previousDueDate: fu.dueDate }
	};
}

/** Restores the old date only while the snooze being undone is still the current one. */
export async function undoSnooze(db: Db, u: SnoozeUndo): Promise<{ ok: boolean }> {
	const fu = await getOpen(db, u.followUpId);
	if (fu.dueDate !== u.dueDate) return { ok: false };
	await runBatch(db, [
		db
			.update(followUp)
			.set({ dueDate: u.previousDueDate })
			.where(and(eq(followUp.id, fu.id), eq(followUp.dueDate, u.dueDate))),
		db.delete(activity).where(and(eq(activity.id, u.activityId), eq(activity.followUpId, fu.id)))
	]);
	return { ok: true };
}

export async function schedule(
	db: Db,
	customerId: string,
	dueDate: string,
	userId: string,
	today: string
): Promise<{ ok: true } | { ok: false; status: 409 | 400; errors: Record<string, string> }> {
	const cust = await db.select().from(customer).where(eq(customer.id, customerId)).get();
	if (!cust) error(404);
	if (dueDate < today) return { ok: false, status: 400, errors: { dueDate: 'out_of_range' } };
	const open = await db
		.select({ id: followUp.id })
		.from(followUp)
		.where(and(eq(followUp.customerId, customerId), eq(followUp.status, 'open')))
		.get();
	if (open) return { ok: false, status: 409, errors: {} };
	const id = crypto.randomUUID();
	await runBatch(db, [
		db.insert(followUp).values({
			id,
			customerId,
			kind: cust.status === 'lead' ? 'lead' : 'retry',
			dueDate,
			attempt: 1
		}),
		db.insert(activity).values({
			customerId,
			type: 'scheduled',
			body: dueDate,
			followUpId: id,
			userId
		})
	]);
	return { ok: true };
}
