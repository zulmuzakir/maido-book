import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { owned, type CrmScope } from './scope.ts';
import { activity, customer, customerOrder, followUp, product } from '#lib/server/db/schema.ts';
import { nextMonthStart } from '#lib/domain/dates.ts';
import { daysOfSupply, reorderDueDate } from '#lib/domain/follow-up.ts';
import { runBatch, type Stmt } from './batch.ts';
import { getRules } from './settings.ts';
import { productOrderOn } from './customers.ts';

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
	crm: CrmScope,
	input: OrderInput
): Promise<{ orderId: string; nextDueDate: string | null }> {
	const { db, ownerId } = crm;
	const [prod, cust, rules, latest, open] = await Promise.all([
		db
			.select()
			.from(product)
			.where(owned(crm, product.ownerId, eq(product.id, input.productId)))
			.get(),
		db
			.select({ id: customer.id })
			.from(customer)
			.where(owned(crm, customer.ownerId, eq(customer.id, input.customerId)))
			.get(),
		getRules(crm),
		db
			.select({ d: sql<string | null>`max(${customerOrder.orderDate})` })
			.from(customerOrder)
			.where(owned(crm, customerOrder.ownerId, eq(customerOrder.customerId, input.customerId)))
			.get(),
		db
			.select({ id: followUp.id })
			.from(followUp)
			.where(
				owned(
					crm,
					followUp.ownerId,
					eq(followUp.customerId, input.customerId),
					eq(followUp.status, 'open')
				)
			)
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
			ownerId,
			customerId: input.customerId,
			productId: input.productId,
			orderDate: input.orderDate,
			qty: input.qty,
			dosePerDay: input.dosePerDay,
			daysSupply,
			totalPaid: input.totalPaid,
			note: input.note,
			createdBy: ownerId
		}),
		db.insert(activity).values({
			ownerId,
			customerId: input.customerId,
			type: 'order',
			body: `${input.qty} ${prod.unitLabel} ${prod.name}`,
			orderId,
			userId: ownerId
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
					.where(owned(crm, followUp.ownerId, eq(followUp.id, open.id)))
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
				.where(owned(crm, customer.ownerId, eq(customer.id, input.customerId))),
			db.insert(followUp).values({
				ownerId,
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

export async function deleteOrder(crm: CrmScope, customerId: string, orderId: string) {
	const [removed] = await crm.db
		.delete(customerOrder)
		.where(
			owned(
				crm,
				customerOrder.ownerId,
				eq(customerOrder.customerId, customerId),
				eq(customerOrder.id, orderId)
			)
		)
		.returning({ id: customerOrder.id });
	if (!removed) error(404);
}

export async function listOrders(crm: CrmScope, opts: { month: string }) {
	const start = `${opts.month}-01`;
	const end = nextMonthStart(start);
	const where = owned(
		crm,
		customerOrder.ownerId,
		gte(customerOrder.orderDate, start),
		lt(customerOrder.orderDate, end)
	);
	const items = await crm.db
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
		.innerJoin(
			customer,
			and(eq(customer.ownerId, customerOrder.ownerId), eq(customer.id, customerOrder.customerId))
		)
		.innerJoin(product, productOrderOn)
		.where(where)
		.orderBy(desc(customerOrder.orderDate), desc(customerOrder.createdAt));
	return {
		items,
		count: items.length,
		revenue: items.reduce((sum, o) => sum + (o.totalPaid ?? 0), 0),
		/** Orders with a total; the per-order average leaves out the ones not recorded yet. */
		recorded: items.filter((o) => o.totalPaid !== null).length
	};
}
