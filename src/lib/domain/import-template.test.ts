import { fileURLToPath } from 'node:url';
import readXlsxFile from 'read-excel-file/node';
import { describe, expect, it } from 'vitest';
import { mapCustomerSheet } from './import-sheet.ts';

// Guards static/templates/maido-book-import.xlsx (built by `pnpm template:build`) against drift
// from the parser.
const TEMPLATE = fileURLToPath(
	new URL('../../../static/templates/maido-book-import.xlsx', import.meta.url)
);
const rules = { leadDays: 3, retryDays: 2, maxAttempts: 3, winbackDays: 30 };
const today = '2026-11-07';

describe('import template', async () => {
	const sheets = await readXlsxFile(TEMPLATE);

	it('has the Customer sheet first and no other sheet the picker could choose', () => {
		expect(sheets.map((s) => s.sheet)).toEqual(['Customer', 'Petunjuk']);
	});
	it('has every header the parser looks for and no data rows', () => {
		expect(mapCustomerSheet(sheets[0].data, today, rules)).toEqual({ rows: [] });
	});
	it('has guide examples that import cleanly', () => {
		const res = mapCustomerSheet(sheets[1].data, today, rules);
		if ('error' in res) throw new Error(`missing ${res.missing.join(', ')}`);
		expect(res.rows.map((r) => [r.name, r.issue])).toEqual([
			['Contoh Ayu', null],
			['Contoh Budi', null]
		]);
		expect(res.rows[0]).toMatchObject({
			phone: '6281234567890',
			lastOrderDate: '2026-10-30',
			lastAction: 'Sudah follow up'
		});
	});
});
