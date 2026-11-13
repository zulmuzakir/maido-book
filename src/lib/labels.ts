import { m } from '#lib/paraglide/messages.js';
import { getLocale } from '#lib/paraglide/runtime.js';
import type { CustomerStatus, FollowUpKind, FollowUpOutcome } from '#lib/domain/types.ts';
import type { QueueBucket } from '#lib/domain/follow-up.ts';
import { FIELD_RANGES, type RangedField } from '#lib/domain/limits.ts';

export const customerStatusLabel = (s: CustomerStatus): string =>
	({ lead: m.status_lead, active: m.status_active, dormant: m.status_dormant })[s]();

export const followUpKindLabel = (k: FollowUpKind): string =>
	({
		reorder: m.kind_reorder,
		retry: m.kind_retry,
		lead: m.kind_lead,
		winback: m.kind_winback,
		closing: m.kind_closing
	})[k]();

export const outcomeLabel = (o: FollowUpOutcome): string =>
	({
		ordered: m.outcome_ordered,
		replied: m.outcome_replied,
		interested: m.outcome_interested,
		no_reply: m.outcome_no_reply,
		not_interested: m.outcome_not_interested
	})[o]();

export const bucketLabel = (b: QueueBucket): string =>
	({
		overdue: m.bucket_overdue,
		today: m.bucket_today,
		waiting: m.bucket_waiting,
		upcoming: m.bucket_upcoming
	})[b]();

/** Where a date field's allowed range starts, for its out-of-range message. */
type DateField = 'nextDate' | 'snoozeDate' | 'scheduleDate' | 'orderDate';
export type ErrorField = RangedField | DateField | 'phone' | (string & {});

const isRanged = (f: string): f is RangedField => f in FIELD_RANGES;

/**
 * Turns a server error code into a message that says how to fix this particular field.
 * Date fields are named by purpose (`snoozeDate`, `scheduleDate`) because their rules differ.
 */
export function fieldError(field: ErrorField, code: string | undefined): string | undefined {
	if (!code) return undefined;
	if (code === 'out_of_range') {
		if (isRanged(field)) {
			const fmt = new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-US');
			const [min, max] = FIELD_RANGES[field];
			return m.error_range({ min: fmt.format(min), max: fmt.format(max) });
		}
		if (field === 'nextDate' || field === 'snoozeDate') return m.error_date_from_tomorrow();
		if (field === 'scheduleDate') return m.error_date_from_today();
		if (field === 'orderDate') return m.error_order_date_future();
	}
	if (code === 'invalid') {
		if (field === 'phone') return m.error_phone_invalid();
		if (field.endsWith('Date')) return m.error_date_invalid();
	}
	switch (code) {
		case 'required':
			return m.error_required();
		case 'too_long':
			return m.error_too_long();
		case 'duplicate':
			return m.error_duplicate();
		case 'last_active':
			return m.error_last_active();
		case 'out_of_range':
			return m.error_out_of_range();
		default:
			return m.error_invalid();
	}
}
