import type { ImportRow } from '#lib/domain/import-sheet.ts';
import { followUpKindLabel } from '#lib/labels.ts';
import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';

export type RowStatus =
	'ready' | 'existing' | 'invalid_phone' | 'phone_date_format' | 'duplicate_in_file';
export type Preview = { file: string; sheet: string; today: string; rows: ImportRow[] };
export type ReadProblem =
	| { kind: 'read' }
	| { kind: 'type' }
	| { kind: 'size' }
	| { kind: 'missing'; columns: string[]; sheet: string }
	| { kind: 'empty'; sheet: string };
export type Outcome = { imported: number; skippedExisting: number; skippedInvalid: number };
export type Failure = 'failed' | 'invalid' | 'empty';

export const MAX_ROWS = 2000;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Thousands of rows freeze phones; reveal the rest in pages on request.
export const PREVIEW_PAGE = 200;
export const SAMPLE_ROWS = 3;

export function statusLabel(status: RowStatus): string {
	switch (status) {
		case 'ready':
			return m.import_status_ready();
		case 'existing':
			return m.import_status_existing();
		case 'invalid_phone':
			return m.import_status_invalid_phone();
		case 'phone_date_format':
			return m.import_status_phone_date_format();
		case 'duplicate_in_file':
			return m.import_status_duplicate_in_file();
	}
}

export const chipClass: Record<RowStatus, string> = {
	ready: 'text-foreground',
	existing: 'text-muted-foreground',
	invalid_phone: 'text-status-overdue',
	phone_date_format: 'text-status-overdue',
	duplicate_in_file: 'text-status-today'
};

export function shortDay(iso: string): string {
	return new Intl.DateTimeFormat(getLocale() === 'id' ? 'id-ID' : 'en-GB', {
		timeZone: 'UTC',
		day: 'numeric',
		month: 'short'
	}).format(new Date(`${iso}T00:00:00Z`));
}

export function lastOrderDate(row: ImportRow): string {
	return row.lastOrderDate ? shortDay(row.lastOrderDate) : '—';
}

export function planKind(row: ImportRow): string {
	return row.plan.followUp ? followUpKindLabel(row.plan.followUp.kind) : m.import_no_plan();
}

// Desktop column: the due date, or the kind label when there is none.
export function planDate(row: ImportRow): string {
	const due = row.plan.followUp?.dueDate;
	return due ? shortDay(due) : planKind(row);
}

// Tablet/phone line under the status: "Follow up 18 Jul".
export function planLine(row: ImportRow): string {
	const due = row.plan.followUp?.dueDate;
	return due ? m.import_follow_up_on({ date: shortDay(due) }) : planKind(row);
}
