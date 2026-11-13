import * as v from 'valibot';
import { CUSTOMER_STATUSES, FOLLOW_UP_KINDS, MANUAL_OUTCOMES } from '#lib/domain/types.ts';
import { FIELD_RANGES as R } from '#lib/domain/limits.ts';
import { checkbox, int, isoDate, optInt, optIsoDate, optStr, phone, str } from './form.ts';

export const customerSchema = v.object({
	name: str(100),
	phone,
	dosePerDay: int(...R.dosePerDay),
	notes: optStr(1000)
});

export const productSchema = v.object({
	name: str(60),
	unitLabel: str(20),
	servingsPerUnit: int(...R.servingsPerUnit),
	price: int(...R.price),
	active: checkbox
});

export const rulesSchema = v.object({
	leadDays: int(...R.leadDays),
	retryDays: int(...R.retryDays),
	maxAttempts: int(...R.maxAttempts),
	winbackDays: int(...R.winbackDays)
});

const body = v.pipe(v.string(), v.trim(), v.nonEmpty(), v.maxLength(1000));
export const templatesSchema = v.object(
	Object.fromEntries(FOLLOW_UP_KINDS.map((k) => [k, body])) as Record<
		(typeof FOLLOW_UP_KINDS)[number],
		typeof body
	>
);

export const noteSchema = v.object({ body });

export const orderSchema = v.object({
	customerId: str(100),
	productId: str(100),
	orderDate: isoDate,
	qty: int(...R.qty),
	dosePerDay: int(...R.dosePerDay),
	totalPaid: optInt(...R.totalPaid),
	note: optStr(1000)
});

export const outcomeSchema = v.object({
	followUpId: str(100),
	outcome: v.picklist(MANUAL_OUTCOMES),
	nextDate: optIsoDate,
	note: optStr(1000)
});
export const snoozeSchema = v.object({ followUpId: str(100), dueDate: isoDate });
export const undoOutcomeSchema = v.object({
	followUpId: str(100),
	activityId: str(100),
	nextFollowUpId: optStr(100),
	previousStatus: v.pipe(
		v.optional(v.string(), ''),
		v.transform((s) => (s === '' ? null : s)),
		v.nullable(v.picklist(CUSTOMER_STATUSES))
	)
});
export const undoSnoozeSchema = v.object({
	followUpId: str(100),
	activityId: str(100),
	dueDate: isoDate,
	previousDueDate: isoDate
});
export const scheduleSchema = v.object({ customerId: str(100), dueDate: isoDate });
export const sentSchema = v.object({ followUpId: str(100), body: optStr(1000) });
export const resendSchema = v.object({ followUpId: str(100), body });
export const saveTemplateSchema = v.object({
	kind: v.picklist(FOLLOW_UP_KINDS),
	body
});
