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

export interface SupplyGap {
	/** Epoch day the stock ran out. */
	start: number;
	/** Epoch day the next order came in, or today while still out. */
	end: number;
	days: number;
	/** Still out of stock today. */
	ongoing: boolean;
}

/** Days without stock: between orders, and from the last run-out until today. Oldest first. */
export function supplyGaps(steps: SupplyStep[], today: string): SupplyGap[] {
	const out: SupplyGap[] = [];
	for (const s of steps) {
		if (s.before < 0)
			out.push({ start: s.day + s.before, end: s.day, days: -s.before, ongoing: false });
	}
	const last = steps.at(-1);
	const todayDay = epochDay(today);
	if (last && todayDay > last.day + last.after) {
		const start = last.day + last.after;
		out.push({ start, end: todayDay, days: todayDay - start, ongoing: true });
	}
	return out;
}

/** "Kosong 3× · rata-rata 8 hari": every gap counts; the average is over the closed ones. */
export function gapSummary(gaps: SupplyGap[]): { count: number; averageDays: number | null } {
	const closed = gaps.filter((g) => !g.ongoing);
	const averageDays = closed.length
		? Math.round(closed.reduce((sum, g) => sum + g.days, 0) / closed.length)
		: null;
	return { count: gaps.length, averageDays };
}
