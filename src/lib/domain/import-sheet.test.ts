import { describe, expect, it } from 'vitest';
import { HEADERS, IMPORT_LIMITS, mapCustomerSheet, TEMPLATE_HEADERS } from './import-sheet.ts';

const rules = { leadDays: 3, retryDays: 2, maxAttempts: 3, winbackDays: 30 };
const header = [
	'No',
	'Nama Customer ',
	'No. WA',
	'Produk',
	'Qty',
	'Pola Minum',
	'Tgl Order Terakhir',
	'Last Action ',
	'Catatan'
];

describe('TEMPLATE_HEADERS', () => {
	it('matches the parsed headers', () => {
		expect(Object.values(TEMPLATE_HEADERS).map((h) => h.toLowerCase())).toEqual(
			Object.values(HEADERS)
		);
	});
});

describe('mapCustomerSheet', () => {
	it('maps rows and flags issues', () => {
		const res = mapCustomerSheet(
			[
				['Customer list'],
				header,
				[1, 'Ayu', '0812-0000-001', 'ROOVE', 50, 2, '2026-10-30', 'Sudah Follow Up', null],
				[2, 'Budi', 628120000001, null, null, null, null, null, null],
				[3, 'Cici', new Date('2026-01-01T00:00:00Z'), null, null, null, null, null, null],
				[4, '', '0811111111111', null, null, null, null, null, null]
			],
			'2026-11-07',
			rules
		);
		if ('error' in res) throw new Error('unexpected');
		expect(res.rows.map((r) => [r.line, r.name, r.issue])).toEqual([
			[3, 'Ayu', null],
			[4, 'Budi', 'duplicate_in_file'],
			[5, 'Cici', 'phone_date_format']
		]);
		expect(res.rows[0].plan.followUp?.dueDate).toBe('2026-11-21');
	});
	it('reports missing columns', () => {
		const res = mapCustomerSheet([['Nama Customer', 'Qty']], '2026-11-07', rules);
		expect(res).toEqual({ error: 'missing_columns', missing: ['no. wa'] });
	});
	it('fits oversized cells to the server limits instead of failing the import', () => {
		const longName = 'A'.repeat(150);
		const notes = '😀'.repeat(600);
		const res = mapCustomerSheet(
			[header, [1, longName, '081200000003', 'P'.repeat(80), 20000, 50, null, null, notes]],
			'2026-11-07',
			rules
		);
		if ('error' in res) throw new Error('unexpected');
		const [row] = res.rows;
		expect(row.name).toHaveLength(IMPORT_LIMITS.name);
		expect(row.name.endsWith('…')).toBe(true);
		expect(row.productName!.length).toBeLessThanOrEqual(IMPORT_LIMITS.productName);
		expect(row.notes!.length).toBeLessThanOrEqual(IMPORT_LIMITS.notes);
		expect(row.notes).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/);
		expect([row.qty, row.dosePerDay]).toEqual([null, null]);
	});
});
