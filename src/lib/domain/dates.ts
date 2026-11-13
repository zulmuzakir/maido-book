export const APP_TIME_ZONE = 'Asia/Jakarta';

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
	timeZone: APP_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

/** Today's calendar day in Asia/Jakarta as YYYY-MM-DD. */
export function todayIso(now: Date = new Date()): string {
	return dayFormatter.format(now);
}

export function isIsoDate(s: string): boolean {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
	const d = new Date(s + 'T00:00:00Z');
	return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function addDays(iso: string, n: number): string {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Latest allowed order date: tomorrow (timezone slack). */
export function maxOrderDate(today: string): string {
	return addDays(today, 1);
}

/** Whole days from `from` to `to` (`to - from`). */
export function diffDays(from: string, to: string): number {
	return Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000);
}

export function monthStart(iso: string): string {
	return iso.slice(0, 8) + '01';
}

export function nextMonthStart(iso: string): string {
	const [y, m] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
}

export function monthKey(iso: string): string {
	return iso.slice(0, 7);
}

export function formatDate(
	iso: string,
	locale: string,
	style: 'short' | 'medium' | 'long'
): string {
	const options: Intl.DateTimeFormatOptions =
		style === 'short'
			? { timeZone: 'UTC', day: 'numeric', month: 'short' }
			: style === 'medium'
				? { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }
				: { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
	return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', options).format(
		new Date(iso + 'T00:00:00Z')
	);
}

/** "9 Nov, 08.12": a timestamp in the app's time zone, 24-hour. */
export function formatDateTime(date: Date, locale: string): string {
	return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: APP_TIME_ZONE
	}).format(date);
}

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/** A valid YYYY-MM that is not after the latest order month, else the current month. */
export function parseMonthParam(value: string | null, today: string): string {
	const cap = monthKey(maxOrderDate(today));
	return value !== null && MONTH_PATTERN.test(value) && value <= cap ? value : monthKey(today);
}

/** "November 2026" (long, with year), "November" (longName) or "Nov" (short) for a YYYY-MM key. */
export function formatMonth(
	key: string,
	locale: string,
	style: 'long' | 'short' | 'longName'
): string {
	const options: Intl.DateTimeFormatOptions =
		style === 'long'
			? { timeZone: 'UTC', month: 'long', year: 'numeric' }
			: style === 'longName'
				? { timeZone: 'UTC', month: 'long' }
				: { timeZone: 'UTC', month: 'short' };
	return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', options).format(
		new Date(key + '-01T00:00:00Z')
	);
}
