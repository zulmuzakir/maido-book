const MS_PER_DAY = 86_400_000;

export interface SupplyStep {
	day: number;
	iso: string;
	/** Stock level just before this order arrives. Negative means days without stock. */
	before: number;
	/** Stock level right after this order. */
	after: number;
}

const epochDay = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / MS_PER_DAY;

/**
 * Sawtooth of stock over time. Each order adds its days to whatever was left (floored at 0).
 * The level then falls by one per day until the next order, and may go below 0.
 * Returned oldest first.
 */
export function supplySteps(orders: { orderDate: string; daysSupply: number }[]): SupplyStep[] {
	const sorted = [...orders].sort((a, b) => a.orderDate.localeCompare(b.orderDate));
	const out: SupplyStep[] = [];
	let level = 0;
	let prevDay = sorted.length ? epochDay(sorted[0].orderDate) : 0;
	for (const o of sorted) {
		const day = epochDay(o.orderDate);
		level -= day - prevDay;
		const before = level;
		const after = Math.max(0, before) + o.daysSupply;
		out.push({ day, iso: o.orderDate, before, after });
		level = after;
		prevDay = day;
	}
	return out;
}
