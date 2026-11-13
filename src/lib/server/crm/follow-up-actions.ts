import { fail, type Action } from '@sveltejs/kit';
import { todayIso } from '#lib/domain/dates.ts';
import { parseForm } from './form.ts';
import { updateTemplate } from './settings.ts';
import {
	markSent,
	logResend,
	recordOutcome,
	schedule,
	snooze,
	undoOutcome,
	undoSnooze
} from './follow-ups.ts';
import {
	outcomeSchema,
	resendSchema,
	scheduleSchema,
	sentSchema,
	saveTemplateSchema,
	snoozeSchema,
	undoOutcomeSchema,
	undoSnoozeSchema
} from './schemas.ts';

const sent: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), sentSchema);
	if (!parsed.ok) return fail(400, { action: 'sent', errors: parsed.errors });
	await markSent(
		locals.db,
		parsed.data.followUpId,
		locals.user!.id,
		locals.user!.name,
		parsed.data.body ?? null
	);
	return { ok: true, action: 'sent' };
};

const resend: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), resendSchema);
	if (!parsed.ok) return fail(400, { action: 'resend', errors: parsed.errors });
	await logResend(locals.db, parsed.data.followUpId, locals.user!.id, parsed.data.body);
	return { ok: true, action: 'resend' };
};

const outcome: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), outcomeSchema);
	if (!parsed.ok) return fail(400, { action: 'outcome', errors: parsed.errors });
	const { followUpId, ...rest } = parsed.data;
	const res = await recordOutcome(locals.db, followUpId, rest, locals.user!.id, todayIso());
	if (!res.ok) return fail(400, { action: 'outcome', errors: res.errors });
	return { ok: true, action: 'outcome', nextDate: res.nextDate, undo: res.undo };
};

const snoozeAction: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), snoozeSchema);
	if (!parsed.ok) return fail(400, { action: 'snooze', errors: parsed.errors });
	const res = await snooze(
		locals.db,
		parsed.data.followUpId,
		parsed.data.dueDate,
		locals.user!.id,
		todayIso()
	);
	if (!res.ok) return fail(400, { action: 'snooze', errors: res.errors });
	return { ok: true, action: 'snooze', undo: res.undo };
};

const undoOutcomeAction: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), undoOutcomeSchema);
	if (!parsed.ok) return fail(400, { action: 'undoOutcome', errors: parsed.errors });
	const res = await undoOutcome(locals.db, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoOutcome', errors: {} });
	return { ok: true, action: 'undoOutcome' };
};

const undoSnoozeAction: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), undoSnoozeSchema);
	if (!parsed.ok) return fail(400, { action: 'undoSnooze', errors: parsed.errors });
	const res = await undoSnooze(locals.db, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoSnooze', errors: {} });
	return { ok: true, action: 'undoSnooze' };
};

const scheduleAction: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), scheduleSchema);
	if (!parsed.ok) return fail(400, { action: 'schedule', errors: parsed.errors });
	const res = await schedule(
		locals.db,
		parsed.data.customerId,
		parsed.data.dueDate,
		locals.user!.id,
		todayIso()
	);
	if (!res.ok) return fail(res.status, { action: 'schedule', errors: res.errors });
	return { ok: true, action: 'schedule' };
};

const saveTemplate: Action = async ({ request, locals }) => {
	const parsed = parseForm(await request.formData(), saveTemplateSchema);
	if (!parsed.ok) return fail(400, { action: 'saveTemplate', errors: parsed.errors });
	await updateTemplate(locals.db, parsed.data.kind, parsed.data.body);
	return { ok: true, action: 'saveTemplate' };
};

export const followUpActions = {
	sent,
	resend,
	outcome,
	snooze: snoozeAction,
	undoOutcome: undoOutcomeAction,
	undoSnooze: undoSnoozeAction,
	schedule: scheduleAction,
	saveTemplate
};
