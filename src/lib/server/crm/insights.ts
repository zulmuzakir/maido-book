import { and, eq, gte, isNotNull, lt, sql } from 'drizzle-orm';
import type { Db } from '#lib/server/db/index.ts';
import { activity, customerOrder, followUp } from '#lib/server/db/schema.ts';
import { addDays, monthKey, monthStart, nextMonthStart } from '#lib/domain/dates.ts';
import { supplyStatus } from '#lib/domain/follow-up.ts';
import type { FollowUpOutcome } from '#lib/domain/types.ts';
import { customerStatusCountsQuery, toCustomerStatusCounts } from './customers.ts';
import { queueQuery, toQueue } from './follow-ups.ts';

/** An order counts toward the conversion if its customer got a WhatsApp message in the 14 days
 * up to and including its order date (Asia/Jakarta). */
const CONVERSION_WINDOW_DAYS = 14;

const jakartaMidnight = (iso: string) => new Date(Date.parse(iso + 'T00:00:00+07:00'));

/** First day of the month `n` months away from the month containing `iso`. */
const shiftMonth = (iso: string, n: number) => {
	const [y, m] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 10);
};

export async function getInsights(db: Db, today: string, month: string) {
	const anchor = month + '-01';
	const start = monthStart(anchor);
	const end = nextMonthStart(anchor);
	const prevStart = shiftMonth(anchor, -1);
	const startMs = jakartaMidnight(start);
	const endMs = jakartaMidnight(end);
	const inMonth = and(gte(customerOrder.orderDate, start), lt(customerOrder.orderDate, end));

	// six months window, newest first
	const months: string[] = [];
	for (let i = 0; i <= 5; i++) months.push(monthKey(shiftMonth(anchor, -i)));
	const oldest = months[months.length - 1];

	// Orders per buyer, for the repeat-customer rate.
	const perBuyer = db
		.select({ c: sql<number>`count(*)`.as('c') })
		.from(customerOrder)
		.groupBy(customerOrder.customerId)
		.as('per_buyer');

	// One D1 round trip for the whole page.
	const [
		queueRows,
		monthRows,
		previousRows,
		repeatRows,
		convertedRows,
		buyerRows,
		contactRows,
		outcomeRows,
		statusRows,
		history,
		dailyRows
	] = await db.batch([
		queueQuery(db, today),
		db
			.select({
				n: sql<number>`count(*)`,
				revenue: sql<number>`coalesce(sum(${customerOrder.totalPaid}), 0)`
			})
			.from(customerOrder)
			.where(inMonth),
		db
			.select({ revenue: sql<number>`coalesce(sum(${customerOrder.totalPaid}), 0)` })
			.from(customerOrder)
			.where(and(gte(customerOrder.orderDate, prevStart), lt(customerOrder.orderDate, start))),
		db
			.select({ n: sql<number>`count(*)` })
			.from(customerOrder)
			.where(
				and(
					inMonth,
					sql`exists (select 1 from customer_order o2 where o2.customer_id = ${customerOrder.customerId} and (o2.order_date < ${customerOrder.orderDate} or (o2.order_date = ${customerOrder.orderDate} and o2.created_at < ${customerOrder.createdAt})))`
				)
			),
		db
			.select({ n: sql<number>`count(*)` })
			.from(customerOrder)
			.where(
				and(
					inMonth,
					// created_at is epoch ms; 25200 s shifts UTC midnight to Jakarta midnight.
					sql`exists (select 1 from activity a where a.customer_id = ${customerOrder.customerId} and a.type = 'wa_sent' and a.created_at >= (unixepoch(${customerOrder.orderDate}, ${`-${CONVERSION_WINDOW_DAYS} days`}) - 25200) * 1000 and a.created_at < (unixepoch(${customerOrder.orderDate}, '+1 day') - 25200) * 1000)`
				)
			),
		db
			.select({
				buyers: sql<number>`count(*)`,
				repeaters: sql<number>`coalesce(sum(${perBuyer.c} >= 2), 0)`
			})
			.from(perBuyer),
		db
			.select({ n: sql<number>`count(*)` })
			.from(activity)
			.where(
				and(
					eq(activity.type, 'wa_sent'),
					gte(activity.createdAt, startMs),
					lt(activity.createdAt, endMs)
				)
			),
		db
			.select({ outcome: followUp.outcome, n: sql<number>`count(*)` })
			.from(followUp)
			.where(
				and(
					isNotNull(followUp.outcome),
					gte(followUp.completedAt, startMs),
					lt(followUp.completedAt, endMs)
				)
			)
			.groupBy(followUp.outcome),
		customerStatusCountsQuery(db),
		db
			.select({
				month: sql<string>`substr(${customerOrder.orderDate}, 1, 7)`,
				orders: sql<number>`count(*)`,
				revenue: sql<number>`coalesce(sum(${customerOrder.totalPaid}), 0)`
			})
			.from(customerOrder)
			.where(gte(customerOrder.orderDate, oldest + '-01'))
			.groupBy(sql`substr(${customerOrder.orderDate}, 1, 7)`),
		db
			.select({
				date: customerOrder.orderDate,
				revenue: sql<number>`coalesce(sum(${customerOrder.totalPaid}), 0)`
			})
			.from(customerOrder)
			.where(inMonth)
			.groupBy(customerOrder.orderDate)
	]);

	const queue = toQueue(queueRows, today);
	const byStatus = toCustomerStatusCounts(statusRows);
	const [monthRow] = monthRows;
	const [previousRow] = previousRows;
	const [repeatRow] = repeatRows;
	const [convertedRow] = convertedRows;
	const [contactRow] = contactRows;
	const buyers = buyerRows[0]?.buyers ?? 0;
	const repeaters = buyerRows[0]?.repeaters ?? 0;

	const outcomes: Record<FollowUpOutcome, number> = {
		ordered: 0,
		interested: 0,
		replied: 0,
		no_reply: 0,
		not_interested: 0
	};
	for (const r of outcomeRows) if (r.outcome) outcomes[r.outcome] = r.n;
	const byMonth = new Map(history.map((h) => [h.month, h]));

	// one bar per day, zero-filled, up to the last day of the month or today
	const lastDay = addDays(end, -1);
	const upTo = today < lastDay ? today : lastDay;
	const revenueByDate = new Map(dailyRows.map((r) => [r.date, r.revenue]));
	const dailyRevenue: { date: string; revenue: number }[] = [];
	for (let d = start; d <= upTo; d = addDays(d, 1))
		dailyRevenue.push({ date: d, revenue: revenueByDate.get(d) ?? 0 });

	const ordersThisMonth = monthRow?.n ?? 0;
	const contactsThisMonth = contactRow?.n ?? 0;
	const convertedOrdersThisMonth = convertedRow?.n ?? 0;

	const winback = [...queue.overdue, ...queue.today]
		.filter((item) => item.kind === 'winback')
		.map((item) => ({
			customerId: item.customer.id,
			followUpId: item.followUpId,
			name: item.customer.name,
			lastOrderDate: item.lastOrder?.orderDate ?? null,
			daysOut: item.lastOrder
				? -supplyStatus({
						orderDate: item.lastOrder.orderDate,
						daysSupply: item.lastOrder.daysSupply,
						today
					}).daysLeft
				: null
		}))
		.sort((a, b) => {
			if (a.daysOut === null) return b.daysOut === null ? 0 : 1;
			if (b.daysOut === null) return -1;
			return a.daysOut - b.daysOut;
		})
		.slice(0, 3);

	return {
		queue: {
			overdue: queue.overdue.length,
			today: queue.today.length,
			waiting: queue.waiting.length
		},
		ordersThisMonth,
		revenueThisMonth: monthRow?.revenue ?? 0,
		previousRevenue: previousRow?.revenue ?? 0,
		repeatOrdersThisMonth: repeatRow?.n ?? 0,
		repeatCustomerRate: buyers ? repeaters / buyers : null,
		contactsThisMonth,
		outcomesThisMonth: outcomes,
		convertedOrdersThisMonth,
		conversion: contactsThisMonth ? convertedOrdersThisMonth / contactsThisMonth : null,
		dailyRevenue,
		winback,
		customersByStatus: byStatus,
		last6Months: months.map((m) => ({
			month: m,
			orders: byMonth.get(m)?.orders ?? 0,
			revenue: byMonth.get(m)?.revenue ?? 0
		}))
	};
}
