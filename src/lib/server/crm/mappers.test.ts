import { describe, expect, it } from 'vitest';
import { toCustomerDetail } from './customers.ts';
import { toMessageContext } from './follow-ups.ts';
import { toRules, toTemplates } from './settings.ts';

describe('toRules', () => {
	it('reads the setting row', () => {
		const row = {
			id: 1,
			leadDays: 3,
			retryDays: 2,
			maxAttempts: 3,
			winbackDays: 30,
			updatedAt: new Date(0)
		};
		expect(toRules([row])).toEqual({ leadDays: 3, retryDays: 2, maxAttempts: 3, winbackDays: 30 });
	});

	it('throws when the row is missing', () => {
		expect(() => toRules([])).toThrow(/setting row missing/);
	});
});

describe('toTemplates', () => {
	it('fills kinds without a row with an empty body', () => {
		const out = toTemplates([{ kind: 'reorder', body: 'Halo {nama}' }]);
		expect(out.reorder).toBe('Halo {nama}');
		expect(out.lead).toBe('');
	});
});

describe('toMessageContext', () => {
	it('uses the first product as the default, or an empty name', () => {
		expect(toMessageContext([{ kind: 'lead', body: 'x' }], [{ name: 'ROOVE' }])).toEqual({
			templates: { lead: 'x' },
			defaultProduct: 'ROOVE'
		});
		expect(toMessageContext([], []).defaultProduct).toBe('');
	});
});

describe('toCustomerDetail', () => {
	const customer = {
		id: 'c1',
		name: 'Sari',
		phone: '628123',
		dosePerDay: 1,
		status: 'active' as const,
		notes: null,
		createdAt: new Date(0),
		updatedAt: new Date(0)
	};
	const order = (i: number) => ({
		id: `o${i}`,
		orderDate: '2026-11-01',
		qty: 10,
		dosePerDay: 1,
		daysSupply: 10,
		totalPaid: null,
		note: null,
		productName: 'ROOVE',
		unitLabel: 'sachet'
	});

	it('is null when the customer does not exist', () => {
		expect(toCustomerDetail([[], [], [], [], []])).toBeNull();
	});

	it('caps the order history and says it was truncated', () => {
		const orders = Array.from({ length: 51 }, (_, i) => order(i));
		const detail = toCustomerDetail([[customer], [], [], orders, []]);
		expect(detail?.orders).toHaveLength(50);
		expect(detail?.ordersTruncated).toBe(true);
		expect(detail?.openFollowUp).toBeNull();
		expect(detail?.lastOrder).toBeNull();
	});
});
