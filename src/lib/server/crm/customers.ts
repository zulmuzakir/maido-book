import { and, asc, desc, eq, ne, sql, type SQL } from 'drizzle-orm';
import type { Db } from '#lib/server/db/index.ts';
import {
	activity,
	customer,
	customerOrder,
	followUp,
	product,
	user
} from '#lib/server/db/schema.ts';
import { todayIso } from '#lib/domain/dates.ts';
import { searchDigits } from '#lib/domain/phone.ts';
import type { CustomerSnapshot, CustomerStatus, FollowUpKind } from '#lib/domain/types.ts';
import { batchSafe, runBatch } from './batch.ts';

/** False only before the first import or customer: the queue shows how to get started instead. */
export const hasCustomersQuery = (db: Db) => db.select({ id: customer.id }).from(customer).limit(1);

export interface OpenFollowUp {
	id: string;
	kind: FollowUpKind;
	dueDate: string;
	contactedAt: Date | null;
	attempt: number;
}
export interface LastOrder {
	orderDate: string;
	qty: number;
	daysSupply: number;
	productName: string;
	unitLabel: string;
}
export interface CustomerListItem {
	id: string;
	name: string;
	phone: string;
	status: CustomerStatus;
	dosePerDay: number;
	openFollowUp: OpenFollowUp | null;
	lastOrder: LastOrder | null;
}

/** Join condition: the customer's latest order. */
export const latestOrderOn = sql`${customerOrder.id} = (select o.id from customer_order o where o.customer_id = ${customer.id} order by o.order_date desc, o.created_at desc limit 1)`;
export const openFollowUpOn = and(
	eq(followUp.customerId, customer.id),
	eq(followUp.status, 'open')
);

export const toOpenFollowUp = (f: {
	id: string | null;
	kind: FollowUpKind | null;
	dueDate: string | null;
	contactedAt: Date | null;
	attempt: number | null;
}): OpenFollowUp | null =>
	f.id
		? {
				id: f.id,
				kind: f.kind!,
				dueDate: f.dueDate!,
				contactedAt: f.contactedAt,
				attempt: f.attempt!
			}
		: null;

export const toLastOrder = (o: {
	orderDate: string | null;
	qty: number | null;
	daysSupply: number | null;
	productName: string | null;
	unitLabel: string | null;
}): LastOrder | null =>
	o.orderDate
		? {
				orderDate: o.orderDate,
				qty: o.qty!,
				daysSupply: o.daysSupply!,
				productName: o.productName!,
				unitLabel: o.unitLabel!
			}
		: null;

export const interestedExists = sql`exists (select 1 from follow_up f where f.customer_id = ${customer.id} and f.status = 'open' and f.kind = 'closing')`;

/** Name or phone match for the search box; undefined when the box is empty. */
function searchCondition(raw: string): SQL | undefined {
	const q = raw.trim().slice(0, 60);
	if (!q) return undefined;
	const digits = searchDigits(q);
	const byName = sql`instr(lower(${customer.name}), lower(${q})) > 0`;
	return digits ? sql`(${byName} or instr(${customer.phone}, ${digits}) > 0)` : byName;
}

function statusCondition(
	status: CustomerStatus | 'all' | 'interested' | undefined
): SQL | undefined {
	if (status === 'interested') return interestedExists;
	if (status && status !== 'all') return eq(customer.status, status);
	return undefined;
}

type CustomerListOpts = {
	q?: string;
	status?: CustomerStatus | 'all' | 'interested';
	page?: number;
	pageSize?: number;
};

/** [total count, one page of rows]; read them with `toCustomerList`. */
export function listCustomersQueries(db: Db, opts: CustomerListOpts) {
	const pageSize = opts.pageSize ?? 30;
	const page = Math.max(1, opts.page ?? 1);
	const where = and(searchCondition(opts.q ?? ''), statusCondition(opts.status));
	return [
		db
			.select(batchSafe({ n: sql<number>`count(*)` }))
			.from(customer)
			.where(where),
		db
			.select(
				batchSafe({
					id: customer.id,
					name: customer.name,
					phone: customer.phone,
					status: customer.status,
					dosePerDay: customer.dosePerDay,
					fuId: followUp.id,
					fuKind: followUp.kind,
					fuDue: followUp.dueDate,
					fuContacted: followUp.contactedAt,
					fuAttempt: followUp.attempt,
					oDate: customerOrder.orderDate,
					oQty: customerOrder.qty,
					oDays: customerOrder.daysSupply,
					pName: product.name,
					pUnit: product.unitLabel
				})
			)
			.from(customer)
			.leftJoin(followUp, openFollowUpOn)
			.leftJoin(customerOrder, latestOrderOn)
			.leftJoin(product, eq(product.id, customerOrder.productId))
			.where(where)
			.orderBy(
				sql`case when ${followUp.dueDate} is null then 1 else 0 end`,
				asc(followUp.dueDate),
				asc(customer.name)
			)
			.limit(pageSize)
			.offset((page - 1) * pageSize)
	] as const;
}

type CustomerListRows = Awaited<ReturnType<typeof listCustomersQueries>[1]>;

export function toCustomerList(
	totalRows: { n: number }[],
	rows: CustomerListRows
): { items: CustomerListItem[]; total: number } {
	return {
		total: totalRows[0]?.n ?? 0,
		items: rows.map((r) => ({
			id: r.id,
			name: r.name,
			phone: r.phone,
			status: r.status,
			dosePerDay: r.dosePerDay,
			openFollowUp: toOpenFollowUp({
				id: r.fuId,
				kind: r.fuKind,
				dueDate: r.fuDue,
				contactedAt: r.fuContacted,
				attempt: r.fuAttempt
			}),
			lastOrder: toLastOrder({
				orderDate: r.oDate,
				qty: r.oQty,
				daysSupply: r.oDays,
				productName: r.pName,
				unitLabel: r.pUnit
			})
		}))
	};
}

export const customerStatusCountsQuery = (db: Db) =>
	db
		.select({ status: customer.status, n: sql<number>`count(*)` })
		.from(customer)
		.groupBy(customer.status);

export function toCustomerStatusCounts(
	rows: Awaited<ReturnType<typeof customerStatusCountsQuery>>
): Record<CustomerStatus, number> {
	const out: Record<CustomerStatus, number> = { lead: 0, active: 0, dormant: 0 };
	for (const r of rows) out[r.status] = r.n;
	return out;
}

export const customerFilterCountsQuery = (db: Db, q: string) =>
	db
		.select({
			all: sql<number>`count(*)`,
			lead: sql<number>`coalesce(sum(${customer.status} = 'lead'), 0)`,
			active: sql<number>`coalesce(sum(${customer.status} = 'active'), 0)`,
			dormant: sql<number>`coalesce(sum(${customer.status} = 'dormant'), 0)`,
			interested: sql<number>`coalesce(sum(${interestedExists}), 0)`
		})
		.from(customer)
		.where(searchCondition(q));

export function toCustomerFilterCounts(
	rows: Awaited<ReturnType<typeof customerFilterCountsQuery>>
): Record<'all' | 'interested' | 'lead' | 'active' | 'dormant', number> {
	const row = rows[0];
	return {
		all: row?.all ?? 0,
		interested: row?.interested ?? 0,
		lead: row?.lead ?? 0,
		active: row?.active ?? 0,
		dormant: row?.dormant ?? 0
	};
}

/** Order rows shown on the customer detail page; one extra row is fetched to detect truncation. */
const ORDER_HISTORY_CAP = 50;
/** Activity rows shown on the customer detail page; one extra row is fetched to detect truncation. */
const ACTIVITY_HISTORY_CAP = 100;

/**
 * [customer, open follow-up, latest order, order history, activity history] for one customer, as
 * batchable queries; read them with `toCustomerDetail`.
 */
export const customerDetailQueries = (db: Db, id: string) =>
	[
		db.select().from(customer).where(eq(customer.id, id)),
		db
			.select()
			.from(followUp)
			.where(and(eq(followUp.customerId, id), eq(followUp.status, 'open'))),
		db
			.select(
				batchSafe({
					orderDate: customerOrder.orderDate,
					qty: customerOrder.qty,
					daysSupply: customerOrder.daysSupply,
					productName: product.name,
					unitLabel: product.unitLabel
				})
			)
			.from(customerOrder)
			.innerJoin(product, eq(product.id, customerOrder.productId))
			.where(eq(customerOrder.customerId, id))
			.orderBy(desc(customerOrder.orderDate), desc(customerOrder.createdAt))
			.limit(1),
		db
			.select(
				batchSafe({
					id: customerOrder.id,
					orderDate: customerOrder.orderDate,
					qty: customerOrder.qty,
					dosePerDay: customerOrder.dosePerDay,
					daysSupply: customerOrder.daysSupply,
					totalPaid: customerOrder.totalPaid,
					note: customerOrder.note,
					productName: product.name,
					unitLabel: product.unitLabel
				})
			)
			.from(customerOrder)
			.innerJoin(product, eq(product.id, customerOrder.productId))
			.where(eq(customerOrder.customerId, id))
			.orderBy(desc(customerOrder.orderDate), desc(customerOrder.createdAt))
			.limit(ORDER_HISTORY_CAP + 1),
		db
			.select(
				batchSafe({
					id: activity.id,
					type: activity.type,
					outcome: activity.outcome,
					body: activity.body,
					createdAt: activity.createdAt,
					actorName: user.name,
					attempt: followUp.attempt,
					// "Order dicatat" rows say what was ordered: "20 sachet ROOVE · Rp 202.000".
					orderQty: customerOrder.qty,
					orderUnit: product.unitLabel,
					orderProduct: product.name,
					orderTotal: customerOrder.totalPaid
				})
			)
			.from(activity)
			.leftJoin(user, eq(user.id, activity.userId))
			.leftJoin(followUp, eq(followUp.id, activity.followUpId))
			.leftJoin(customerOrder, eq(customerOrder.id, activity.orderId))
			.leftJoin(product, eq(product.id, customerOrder.productId))
			.where(eq(activity.customerId, id))
			.orderBy(desc(activity.createdAt), desc(activity.id))
			.limit(ACTIVITY_HISTORY_CAP + 1)
	] as const;

type DetailRows<I extends number> = Awaited<ReturnType<typeof customerDetailQueries>[I]>;

/** Null when the customer does not exist. */
export function toCustomerDetail([cs, fus, lasts, orders, activities]: [
	DetailRows<0>,
	DetailRows<1>,
	DetailRows<2>,
	DetailRows<3>,
	DetailRows<4>
]) {
	const c = cs[0];
	if (!c) return null;
	const fu = fus[0];
	const last = lasts[0];
	return {
		customer: c,
		openFollowUp: fu
			? ({
					id: fu.id,
					kind: fu.kind,
					dueDate: fu.dueDate,
					contactedAt: fu.contactedAt,
					attempt: fu.attempt
				} satisfies OpenFollowUp)
			: null,
		lastOrder: last ?? null,
		orders: orders.slice(0, ORDER_HISTORY_CAP),
		activities: activities.slice(0, ACTIVITY_HISTORY_CAP),
		ordersTruncated: orders.length > ORDER_HISTORY_CAP,
		activitiesTruncated: activities.length > ACTIVITY_HISTORY_CAP
	};
}

export async function getCustomerDetail(db: Db, id: string) {
	const [c, fu, last, orders, activities] = await db.batch(customerDetailQueries(db, id));
	return toCustomerDetail([c, fu, last, orders, activities]);
}

export async function findByPhone(db: Db, phone: string, excludeId?: string) {
	const row = await db
		.select({ id: customer.id, name: customer.name })
		.from(customer)
		.where(
			excludeId
				? and(eq(customer.phone, phone), ne(customer.id, excludeId))
				: eq(customer.phone, phone)
		)
		.get();
	return row ?? null;
}

export interface CustomerInput {
	name: string;
	phone: string;
	dosePerDay: number;
	notes: string | null;
}

export async function createCustomer(
	db: Db,
	input: CustomerInput,
	userId: string,
	today: string
): Promise<{ id: string } | { duplicateOf: { id: string; name: string } }> {
	const dup = await findByPhone(db, input.phone);
	if (dup) return { duplicateOf: dup };
	const id = crypto.randomUUID();
	const fuId = crypto.randomUUID();
	await runBatch(db, [
		db.insert(customer).values({ id, ...input, status: 'lead' }),
		db.insert(followUp).values({
			id: fuId,
			customerId: id,
			kind: 'lead',
			dueDate: today,
			attempt: 1
		}),
		db.insert(activity).values({ customerId: id, type: 'customer_created', userId })
	]);
	return { id };
}

export async function updateCustomer(
	db: Db,
	id: string,
	input: CustomerInput
): Promise<{ ok: true } | { duplicateOf: { id: string; name: string } }> {
	const dup = await findByPhone(db, input.phone, id);
	if (dup) return { duplicateOf: dup };
	await db.update(customer).set(input).where(eq(customer.id, id));
	return { ok: true };
}

export async function deleteCustomer(db: Db, id: string) {
	await db.delete(customer).where(eq(customer.id, id));
}

export async function addNote(db: Db, customerId: string, body: string, userId: string) {
	await db.insert(activity).values({ customerId, type: 'note', body, userId });
}

export async function customerSnapshot(db: Db, id: string): Promise<CustomerSnapshot | null> {
	const detail = await getCustomerDetail(db, id);
	return detail ? snapshotOf(detail) : null;
}

export function snapshotOf(
	detail: NonNullable<ReturnType<typeof toCustomerDetail>>
): CustomerSnapshot {
	const { customer: c, lastOrder, openFollowUp, orders } = detail;
	return {
		id: c.id,
		name: c.name,
		phone: c.phone,
		dosePerDay: c.dosePerDay,
		since: todayIso(c.createdAt),
		orderCount: orders.length,
		orderCountCapped: detail.ordersTruncated,
		lastOrder: lastOrder
			? {
					qty: lastOrder.qty,
					unitLabel: lastOrder.unitLabel,
					orderDate: lastOrder.orderDate,
					daysSupply: lastOrder.daysSupply
				}
			: null,
		followUp: openFollowUp
			? { dueDate: openFollowUp.dueDate, contacted: openFollowUp.contactedAt !== null }
			: null
	};
}
