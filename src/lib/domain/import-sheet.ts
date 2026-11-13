import { isIsoDate } from './dates.ts';
import { FIELD_RANGES } from './limits.ts';
import { normalizePhone } from './phone.ts';
import { planImportedCustomer, type ImportPlan } from './follow-up.ts';
import type { RuleSettings } from './types.ts';

export interface ImportRow {
	line: number;
	name: string;
	phone: string | null;
	productName: string | null;
	qty: number | null;
	dosePerDay: number | null;
	lastOrderDate: string | null;
	lastAction: string | null;
	notes: string | null;
	issue: 'invalid_phone' | 'phone_date_format' | 'duplicate_in_file' | null;
	plan: ImportPlan;
}

const HEADERS = {
	name: 'nama customer',
	phone: 'no. wa',
	productName: 'produk',
	qty: 'qty',
	dosePerDay: 'pola minum',
	lastOrderDate: 'tgl order terakhir',
	lastAction: 'last action',
	notes: 'catatan'
} as const;
type Field = keyof typeof HEADERS;

/** Server-side limits for imported rows. Cells are fitted to them here so one oversized cell
 * cannot reject the whole import. */
export const IMPORT_LIMITS = {
	name: 100,
	productName: 60,
	lastAction: 60,
	notes: 1000,
	qty: FIELD_RANGES.qty[1],
	dosePerDay: FIELD_RANGES.dosePerDay[1]
} as const;

const cellText = (v: unknown, max: number): string | null => {
	if (v === null || v === undefined) return null;
	if (v instanceof Date) return null;
	const s = String(v).trim();
	if (s === '') return null;
	if (s.length <= max) return s;
	// Leave room for the ellipsis and never cut an emoji (surrogate pair) in half.
	let cut = s.slice(0, max - 1);
	if (/[\uD800-\uDBFF]$/.test(cut)) cut = cut.slice(0, -1);
	return `${cut.trimEnd()}…`;
};

/** Positive integer up to `max`; anything else counts as missing. */
const posInt = (v: unknown, max: number): number | null => {
	const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : NaN;
	return Number.isInteger(n) && n > 0 && n <= max ? n : null;
};

const pad = (n: number) => String(n).padStart(2, '0');

function parseDate(v: unknown): string | null {
	if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString().slice(0, 10);
	if (typeof v === 'number' && Number.isFinite(v))
		return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10);
	if (typeof v === 'string') {
		const s = v.trim();
		if (isIsoDate(s)) return s;
		const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
		if (m) {
			const iso = `${m[3]}-${pad(Number(m[2]))}-${pad(Number(m[1]))}`;
			return isIsoDate(iso) ? iso : null;
		}
	}
	return null;
}

export function mapCustomerSheet(
	rows: unknown[][],
	today: string,
	rules: RuleSettings
): { rows: ImportRow[] } | { error: 'missing_columns'; missing: string[] } {
	const norm = (v: unknown) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
	const headerIdx = rows.findIndex((r) => r.some((c) => norm(c) === HEADERS.name));
	if (headerIdx < 0) return { error: 'missing_columns', missing: [HEADERS.name, HEADERS.phone] };

	const cols = {} as Partial<Record<Field, number>>;
	rows[headerIdx].forEach((c, i) => {
		const h = norm(c);
		for (const f of Object.keys(HEADERS) as Field[])
			if (HEADERS[f] === h && cols[f] === undefined) cols[f] = i;
	});
	const missing = (['name', 'phone'] as const)
		.filter((f) => cols[f] === undefined)
		.map((f) => HEADERS[f]);
	if (missing.length) return { error: 'missing_columns', missing };

	const get = (r: unknown[], f: Field) => (cols[f] === undefined ? undefined : r[cols[f]]);
	const seen = new Set<string>();
	const out: ImportRow[] = [];

	for (let i = headerIdx + 1; i < rows.length; i++) {
		const r = rows[i];
		const name = cellText(get(r, 'name'), IMPORT_LIMITS.name);
		if (!name) continue;
		const rawPhone = get(r, 'phone');
		const phone = normalizePhone(rawPhone);
		let issue: ImportRow['issue'] = null;
		if (!phone) issue = rawPhone instanceof Date ? 'phone_date_format' : 'invalid_phone';
		else if (seen.has(phone)) issue = 'duplicate_in_file';
		else seen.add(phone);

		const qty = posInt(get(r, 'qty'), IMPORT_LIMITS.qty);
		const dosePerDay = posInt(get(r, 'dosePerDay'), IMPORT_LIMITS.dosePerDay);
		const lastOrderDate = parseDate(get(r, 'lastOrderDate'));
		const lastAction = cellText(get(r, 'lastAction'), IMPORT_LIMITS.lastAction);
		out.push({
			line: i + 1,
			name,
			phone,
			productName: cellText(get(r, 'productName'), IMPORT_LIMITS.productName),
			qty,
			dosePerDay,
			lastOrderDate,
			lastAction,
			notes: cellText(get(r, 'notes'), IMPORT_LIMITS.notes),
			issue,
			plan: planImportedCustomer(
				{ lastAction, lastOrderDate, qty, dosePerDay, servingsPerUnit: 1 },
				today,
				rules
			)
		});
	}
	return { rows: out };
}
