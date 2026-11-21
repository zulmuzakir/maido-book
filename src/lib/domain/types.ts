export const CUSTOMER_STATUSES = ['lead', 'active', 'dormant'] as const;
export const FOLLOW_UP_KINDS = ['reorder', 'retry', 'lead', 'winback', 'closing'] as const;
export const FOLLOW_UP_STATUSES = ['open', 'done', 'cancelled'] as const;
export const FOLLOW_UP_OUTCOMES = [
	'ordered',
	'interested',
	'replied',
	'no_reply',
	'not_interested'
] as const;
export const MANUAL_OUTCOMES = ['replied', 'interested', 'no_reply', 'not_interested'] as const;
export const ACTIVITY_TYPES = [
	'wa_sent',
	'outcome',
	'order',
	'note',
	'snooze',
	'scheduled',
	'customer_created',
	'import'
] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export type FollowUpKind = (typeof FOLLOW_UP_KINDS)[number];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];
export type FollowUpOutcome = (typeof FOLLOW_UP_OUTCOMES)[number];
export type ManualOutcome = (typeof MANUAL_OUTCOMES)[number];
export type ActivityType = (typeof ACTIVITY_TYPES)[number];
export type TemplateKind = FollowUpKind;

export interface RuleSettings {
	leadDays: number;
	retryDays: number;
	maxAttempts: number;
	winbackDays: number;
}

/** The editable fields of a product, as the settings forms show them. */
export interface ProductFields {
	name: string;
	unitLabel: string;
	servingsPerUnit: number;
	price: number;
}

/** What the customer forms' side panel shows about one customer (the duplicate, or the one being edited). */
export interface CustomerSnapshot {
	id: string;
	name: string;
	phone: string;
	dosePerDay: number;
	/** Jakarta date the customer was added. */
	since: string;
	orderCount: number;
	/** The count stopped at the order history cap. */
	orderCountCapped: boolean;
	lastOrder: { qty: number; unitLabel: string; orderDate: string; daysSupply: number } | null;
	followUp: { dueDate: string; contacted: boolean } | null;
}
