import { describe, expect, it } from 'vitest';
import {
	daysOfSupply,
	planAfterOutcome,
	planImportedCustomer,
	reorderDueDate
} from './follow-up.ts';

const rules = { leadDays: 3, retryDays: 2, maxAttempts: 3, winbackDays: 30 };
const due = (orderDate: string, qty: number, dosePerDay: number, leadDays = 3) =>
	reorderDueDate({
		orderDate,
		daysSupply: daysOfSupply({ qty, servingsPerUnit: 1, dosePerDay }),
		leadDays
	});

describe('reorderDueDate', () => {
	it('matches the spreadsheet formula', () => {
		expect(due('2026-07-01', 20, 1)).toBe('2026-07-18');
		expect(due('2026-06-10', 50, 2)).toBe('2026-07-02');
	});
	it('clamps to the order date', () => {
		expect(due('2026-07-01', 5, 2, 7)).toBe('2026-07-01');
	});
});

describe('planAfterOutcome', () => {
	const base = { today: '2026-11-07', rules, kind: 'retry' as const };
	it('retries until max attempts', () => {
		expect(planAfterOutcome({ ...base, outcome: 'no_reply', attempt: 2 })).toEqual({
			customerStatus: null,
			next: { kind: 'retry', dueDate: '2026-11-09', attempt: 3 }
		});
	});
	it('goes dormant with win-back on the last attempt', () => {
		expect(planAfterOutcome({ ...base, outcome: 'no_reply', attempt: 3 })).toEqual({
			customerStatus: 'dormant',
			next: { kind: 'winback', dueDate: '2026-12-07', attempt: 1 }
		});
	});
	it('honours nextDate on reply', () => {
		expect(
			planAfterOutcome({ ...base, outcome: 'replied', attempt: 2, nextDate: '2026-11-20' })
		).toEqual({ customerStatus: null, next: { kind: 'retry', dueDate: '2026-11-20', attempt: 1 } });
	});
	it('not interested ends follow-ups', () => {
		expect(planAfterOutcome({ ...base, outcome: 'not_interested', attempt: 1 })).toEqual({
			customerStatus: 'dormant',
			next: null
		});
	});
	it('interested schedules a closing follow-up', () => {
		expect(
			planAfterOutcome({ ...base, outcome: 'interested', attempt: 2, nextDate: '2026-11-20' })
		).toEqual({
			customerStatus: null,
			next: { kind: 'closing', dueDate: '2026-11-20', attempt: 1 }
		});
	});
	it('no reply on a closing follow-up stays closing, then goes dormant', () => {
		expect(planAfterOutcome({ ...base, outcome: 'no_reply', kind: 'closing', attempt: 1 })).toEqual(
			{
				customerStatus: null,
				next: { kind: 'closing', dueDate: '2026-11-09', attempt: 2 }
			}
		);
		expect(
			planAfterOutcome({ ...base, outcome: 'no_reply', kind: 'closing', attempt: 3 }).next?.kind
		).toBe('winback');
	});
});

describe('planImportedCustomer', () => {
	const today = '2026-11-07';
	const plan = (
		lastAction: string | null,
		lastOrderDate: string | null,
		qty: number | null,
		dosePerDay: number | null
	) =>
		planImportedCustomer(
			{ lastAction, lastOrderDate, qty, dosePerDay, servingsPerUnit: 1 },
			today,
			rules
		);

	it('schedules reorder for a recent order', () => {
		expect(plan('Sudah Follow Up', '2026-10-30', 50, 2).followUp).toEqual({
			kind: 'reorder',
			dueDate: '2026-11-21',
			contacted: false
		});
	});
	it('past-due Sudah Follow Up waits for a reply, keeping its due date', () => {
		expect(plan('Sudah Follow Up', '2026-06-10', 50, 2).followUp).toEqual({
			kind: 'reorder',
			dueDate: '2026-07-02',
			contacted: true
		});
	});
	it('past-due Closing / Order is a win-back', () => {
		expect(plan('Closing / Order', '2026-06-10', 50, 2).followUp?.kind).toBe('winback');
	});
	it('marks waiting rows as contacted', () => {
		expect(plan('Menunggu Balasan', '2026-10-30', 50, 2).followUp?.contacted).toBe(true);
	});
	it('interested without order is a closing follow-up due today', () => {
		const p = plan('Customer Berminat', null, null, null);
		expect(p.status).toBe('lead');
		expect(p.followUp).toEqual({ kind: 'closing', dueDate: today, contacted: false });
		expect(p.order).toBeNull();
	});
	it('interested with order is closing too', () => {
		expect(plan('Customer Berminat', '2026-10-30', 50, 2).followUp?.kind).toBe('closing');
	});
	it('not interested is dormant without follow-up', () => {
		const p = plan('Customer Belum Berminat', null, null, null);
		expect(p.status).toBe('dormant');
		expect(p.followUp).toBeNull();
	});
});
