import { addDays, diffDays } from './dates.ts';
import type { CustomerStatus, FollowUpKind, ManualOutcome, RuleSettings } from './types.ts';

export function daysOfSupply(a: {
	qty: number;
	servingsPerUnit: number;
	dosePerDay: number;
}): number {
	return Math.ceil((a.qty * a.servingsPerUnit) / a.dosePerDay);
}

export function reorderDueDate(a: {
	orderDate: string;
	daysSupply: number;
	leadDays: number;
}): string {
	return addDays(a.orderDate, Math.max(0, a.daysSupply - a.leadDays));
}

export function supplyStatus(a: { orderDate: string; daysSupply: number; today: string }): {
	daysLeft: number;
	remainingRatio: number;
	runsOutOn: string;
} {
	const daysLeft = a.daysSupply - diffDays(a.orderDate, a.today);
	const ratio = a.daysSupply > 0 ? daysLeft / a.daysSupply : 0;
	return {
		daysLeft,
		remainingRatio: Math.min(1, Math.max(0, ratio)),
		runsOutOn: addDays(a.orderDate, a.daysSupply)
	};
}

export type QueueBucket = 'overdue' | 'today' | 'waiting' | 'upcoming';

export function queueBucket(
	f: { dueDate: string; contactedAt: unknown | null },
	today: string
): QueueBucket {
	if (f.contactedAt) return 'waiting';
	if (f.dueDate < today) return 'overdue';
	if (f.dueDate === today) return 'today';
	return 'upcoming';
}

export interface OutcomePlan {
	customerStatus: CustomerStatus | null;
	next: { kind: FollowUpKind; dueDate: string; attempt: number } | null;
}

export function planAfterOutcome(a: {
	outcome: ManualOutcome;
	kind: FollowUpKind;
	attempt: number;
	today: string;
	nextDate?: string;
	rules: RuleSettings;
}): OutcomePlan {
	const { outcome, kind, attempt, today, nextDate, rules } = a;
	if (outcome === 'not_interested') return { customerStatus: 'dormant', next: null };
	const retryDate = nextDate ?? addDays(today, rules.retryDays);
	if (outcome === 'replied')
		return { customerStatus: null, next: { kind: 'retry', dueDate: retryDate, attempt: 1 } };
	if (outcome === 'interested')
		return { customerStatus: null, next: { kind: 'closing', dueDate: retryDate, attempt: 1 } };
	if (attempt < rules.maxAttempts)
		return {
			customerStatus: null,
			next: {
				kind: kind === 'closing' ? 'closing' : 'retry',
				dueDate: retryDate,
				attempt: attempt + 1
			}
		};
	return {
		customerStatus: 'dormant',
		next: { kind: 'winback', dueDate: addDays(today, rules.winbackDays), attempt: 1 }
	};
}

export interface ImportPlan {
	status: CustomerStatus;
	order: { orderDate: string; qty: number; dosePerDay: number; daysSupply: number } | null;
	followUp: { kind: FollowUpKind; dueDate: string; contacted: boolean } | null;
}

export function planImportedCustomer(
	a: {
		lastAction: string | null;
		lastOrderDate: string | null;
		qty: number | null;
		dosePerDay: number | null;
		servingsPerUnit: number;
	},
	today: string,
	rules: RuleSettings
): ImportPlan {
	const hasOrder = !!(a.lastOrderDate && a.qty);
	const dose = a.dosePerDay ?? 1;
	let order: ImportPlan['order'] = null;
	let computed: string | null = null;
	if (hasOrder) {
		const daysSupply = daysOfSupply({
			qty: a.qty!,
			servingsPerUnit: a.servingsPerUnit,
			dosePerDay: dose
		});
		order = { orderDate: a.lastOrderDate!, qty: a.qty!, dosePerDay: dose, daysSupply };
		computed = reorderDueDate({
			orderDate: a.lastOrderDate!,
			daysSupply,
			leadDays: rules.leadDays
		});
	}
	const later = (d: string) => (d > today ? d : today);
	const baseStatus: CustomerStatus = hasOrder ? 'active' : 'lead';
	const action = (a.lastAction ?? '').trim().toLowerCase();
	const fu = (kind: FollowUpKind, dueDate: string, contacted = false) => ({
		kind,
		dueDate,
		contacted
	});

	switch (action) {
		case 'customer belum berminat':
			return { status: 'dormant', order, followUp: null };
		case 'tidak ada respon':
			return {
				status: 'dormant',
				order,
				followUp: fu('winback', later(addDays(computed ?? today, rules.winbackDays)))
			};
		case 'customer berminat':
			return { status: baseStatus, order, followUp: fu('closing', today) };
		case 'menunggu balasan':
			return {
				status: baseStatus,
				order,
				followUp: fu(hasOrder ? 'reorder' : 'lead', computed ?? today, true)
			};
		case 'customer membalas':
		case 'follow up ulang':
			return { status: baseStatus, order, followUp: fu('retry', today) };
		case 'sudah follow up':
			if (computed)
				return {
					status: baseStatus,
					order,
					followUp: fu('reorder', computed, computed < today)
				};
			return { status: baseStatus, order, followUp: fu('lead', today, true) };
		case 'closing / order':
			if (computed && computed >= today)
				return { status: baseStatus, order, followUp: fu('reorder', computed) };
			if (hasOrder)
				return {
					status: baseStatus,
					order,
					followUp: fu('winback', later(addDays(computed!, rules.winbackDays)))
				};
			return { status: baseStatus, order, followUp: fu('lead', today) };
		default:
			return {
				status: baseStatus,
				order,
				followUp: hasOrder ? fu('reorder', computed!) : fu('lead', today)
			};
	}
}
