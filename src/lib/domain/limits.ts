/** Allowed integer ranges for numeric form fields. The server schemas validate against these and
 * the UI quotes them in error messages, so both always agree. */
export const FIELD_RANGES = {
	qty: [1, 10_000],
	dosePerDay: [1, 20],
	servingsPerUnit: [1, 100],
	price: [0, 1_000_000_000],
	totalPaid: [0, 10_000_000_000],
	leadDays: [0, 30],
	retryDays: [1, 30],
	maxAttempts: [1, 10],
	winbackDays: [7, 365]
} as const satisfies Record<string, readonly [number, number]>;

export type RangedField = keyof typeof FIELD_RANGES;
