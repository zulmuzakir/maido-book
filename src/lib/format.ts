import { getLocale } from '#lib/paraglide/runtime.js';
import { m } from '#lib/paraglide/messages.js';
import { diffDays } from '#lib/domain/dates.ts';

export function formatRupiah(n: number): string {
	return new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-US', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(n);
}

export function relativeDue(dueDate: string, today: string): string {
	const d = diffDays(today, dueDate);
	if (d === 0) return m.due_today();
	if (d === 1) return m.due_tomorrow();
	if (d > 1) return m.due_in_days({ count: d });
	return m.overdue_days({ count: -d });
}

export const initialsOf = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');

export function formatRupiahCompact(n: number): string {
	return new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-US', {
		style: 'currency',
		currency: 'IDR',
		notation: 'compact',
		maximumFractionDigits: 2
	}).format(n);
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? '';
