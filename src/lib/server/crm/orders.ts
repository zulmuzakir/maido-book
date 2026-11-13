import { and, asc, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { Db } from '#lib/server/db/index.ts';
import { activity, customer, customerOrder, followUp, product } from '#lib/server/db/schema.ts';
import { nextMonthStart } from '#lib/domain/dates.ts';
import { daysOfSupply, reorderDueDate } from '#lib/domain/follow-up.ts';
import { runBatch, type Stmt } from './batch.ts';
import { getRules, listProducts } from './settings.ts';

export async function orderFormOptions(db: Db) {
	const [customers, products] = await Promise.all([
		db
			.select({
				id: customer.id,
				name: customer.name,
				phone: customer.phone,
				dosePerDay: customer.dosePerDay,
				lastOrderDate: sql<
					string | null
				>`(select max(o.order_date) from customer_order o where o.customer_id = ${customer.id})`
			})
			.from(customer)
			.orderBy(asc(customer.name)),
		listProducts(db, { activeOnly: true })
	]);
	return { customers, products };
}

export interface OrderInput {
	customerId: string;
	productId: string;
	orderDate: string;
	qty: number;
	dosePerDay: number;
	totalPaid: number | null;
	note: string | null;
}

export async function createOrder(
	db: Db,
	input: OrderInput,
	userId: string
): Promise<{ orderId: string; nextDueDate: string | null }> {
	const [prod, cust, rules, latest, open] = await Promise.all([
		db.select().from(product).where(eq(product.id, input.productId)).get(),
		db.select({ id: customer.id }).from(customer).where(eq(customer.id, input.customerId)).get(),
		getRules(db),
		db
			.select({ d: sql<string | null>`max(${customerOrder.orderDate})` })
			.from(customerOrder)
			.where(eq(customerOrder.customerId, input.customerId))
			.get(),
		db
			.select({ id: followUp.id })
			.from(followUp)
			.where(and(eq(followUp.customerId, input.customerId), eq(followUp.status, 'open')))
			.get()
	]);
	if (!prod || !cust) error(404);

	const daysSupply = daysOfSupply({
		qty: input.qty,
		servingsPerUnit: prod.servingsPerUnit,
		dosePerDay: input.dosePerDay
	});
	const orderId = crypto.randomUUID();
	const stmts: Stmt[] = [
		db.insert(customerOrder).values({
			id: orderId,
			customerId: input.customerId,
			productId: input.productId,
			orderDate: input.orderDate,
			qty: input.qty,
			dosePerDay: input.dosePerDay,
			daysSupply,
			totalPaid: input.totalPaid,
			note: input.note,
			createdBy: userId
		}),
		db.insert(activity).values({
			customerId: input.customerId,
			type: 'order',
			body: `${input.qty} ${prod.unitLabel} ${prod.name}`,
			orderId,
			userId
		})
	];

	let nextDueDate: string | null = null;
	const prev = latest?.d ?? null;
	if (!prev || input.orderDate >= prev) {
		if (open)
			stmts.push(
				db
					.update(followUp)
					.set({ status: 'done', outcome: 'ordered', completedAt: new Date(), orderId })
					.where(eq(followUp.id, open.id))
			);
		nextDueDate = reorderDueDate({
			orderDate: input.orderDate,
			daysSupply,
			leadDays: rules.leadDays
		});
		stmts.push(
			db
				.update(customer)
				.set({ status: 'active', dosePerDay: input.dosePerDay })
				.where(eq(customer.id, input.customerId)),
			db.insert(followUp).values({
				customerId: input.customerId,
				kind: 'reorder',
				attempt: 1,
				dueDate: nextDueDate
			})
		);
	}
	await runBatch(db, stmts);
	return { orderId, nextDueDate };
}

export async function deleteOrder(db: Db, orderId: string) {
	await db.delete(customerOrder).where(eq(customerOrder.id, orderId));
}

export async function listOrders(db: Db, opts: { month: string }) {
	const start = `${opts.month}-01`;
	const end = nextMonthStart(start);
	const where = and(gte(customerOrder.orderDate, start), lt(customerOrder.orderDate, end));
	const items = await db
		.select({
			id: customerOrder.id,
			orderDate: customerOrder.orderDate,
			customerId: customer.id,
			customerName: customer.name,
			productName: product.name,
			unitLabel: product.unitLabel,
			qty: customerOrder.qty,
			totalPaid: customerOrder.totalPaid
		})
		.from(customerOrder)
		.innerJoin(customer, eq(customer.id, customerOrder.customerId))
		.innerJoin(product, eq(product.id, customerOrder.productId))
		.where(where)
		.orderBy(desc(customerOrder.orderDate), desc(customerOrder.createdAt));
	return {
		items,
		count: items.length,
		revenue: items.reduce((sum, o) => sum + (o.totalPaid ?? 0), 0)
	};
}
