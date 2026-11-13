import { describe, expect, it } from 'vitest';
import { addDays, formatDateTime, parseMonthParam, todayIso } from './dates.ts';

describe('dates', () => {
	it('uses the Jakarta calendar day', () => {
		expect(todayIso(new Date('2026-11-06T17:30:00Z'))).toBe('2026-11-07');
		expect(todayIso(new Date('2026-11-06T16:30:00Z'))).toBe('2026-11-06');
	});
	it('adds days across year end', () => {
		expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
	});
});

describe('parseMonthParam', () => {
	const today = '2026-11-09';
	it('falls back to the current month', () => {
		expect(parseMonthParam(null, today)).toBe('2026-11');
		expect(parseMonthParam('2026-13', today)).toBe('2026-11');
		expect(parseMonthParam('2027-01', today)).toBe('2026-11');
	});
	it('accepts a past month', () => {
		expect(parseMonthParam('2026-10', today)).toBe('2026-10');
	});
});

describe('formatDateTime', () => {
	it('shows day, month and 24-hour time in Jakarta', () => {
		const s = formatDateTime(new Date('2026-11-09T01:12:00Z'), 'id');
		expect(s).toContain('9 Nov');
		expect(s).toContain('08.12');
	});
});
