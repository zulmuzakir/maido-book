import { diffDays, todayIso } from '#lib/domain/dates.ts';
import { queueBucket, type QueueBucket } from '#lib/domain/follow-up.ts';
import type { TemplateVars } from '#lib/domain/template.ts';
import type { CustomerStatus, FollowUpKind, RuleSettings } from '#lib/domain/types.ts';
import { relativeDue } from '#lib/format.ts';
import { m } from '#lib/paraglide/messages.js';

/** One open follow-up as the queue and the customer page show it. */
export interface QueueRowItem {
	followUpId: string;
	kind: FollowUpKind;
	dueDate: string;
	attempt: number;
	contactedAt: Date | null;
	/** Rendered WhatsApp text for this follow-up. */
	message: string;
	/** Template variables used to render `message`; the edit flow turns text back into a template. */
	vars: TemplateVars;
	waUrl: string;
	customer: { id: string; name: string; phone: string; dosePerDay: number; status: CustomerStatus };
	lastOrder: {
		orderDate: string;
		qty: number;
		daysSupply: number;
		productName: string;
		unitLabel: string;
	} | null;
}

export interface DueState {
	bucket: QueueBucket;
	/** Waiting past the retry window: the reply never came. */
	stale: boolean;
	label: string;
	/** Text colour class for the label. */
	tone: string;
}

export function dueState(item: QueueRowItem, today: string, rules: RuleSettings): DueState {
	const bucket = queueBucket({ dueDate: item.dueDate, contactedAt: item.contactedAt }, today);
	if (bucket === 'waiting') {
		const days = item.contactedAt ? diffDays(todayIso(item.contactedAt), today) : 0;
		const stale = days >= rules.retryDays;
		return {
			bucket,
			stale,
			label: stale
				? m.today_needs_follow_up()
				: days === 0
					? m.today_waiting_today()
					: days === 1
						? m.today_waiting_day_one()
						: m.today_waiting_days({ count: days }),
			tone: stale
				? 'font-semibold text-status-overdue'
				: days === 0
					? 'font-semibold text-foreground'
					: 'font-semibold text-status-today'
		};
	}
	return {
		bucket,
		stale: false,
		label: relativeDue(item.dueDate, today),
		tone:
			bucket === 'overdue'
				? 'text-status-overdue font-medium'
				: bucket === 'today'
					? 'text-status-today font-medium'
					: 'text-muted-foreground'
	};
}

/** The message text the WhatsApp link pre-fills, for previewing before sending. */
export function messageOf(waUrl: string): string {
	try {
		return new URL(waUrl).searchParams.get('text') ?? '';
	} catch {
		return '';
	}
}
