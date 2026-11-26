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
	undoSent,
	undoResend,
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
	undoSentSchema,
	undoResendSchema,
	undoSnoozeSchema
} from './schemas.ts';
import { requireCrm } from './scope.ts';

const sent: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), sentSchema);
	if (!parsed.ok) return fail(400, { action: 'sent', errors: parsed.errors });
	const undo = await markSent(
		crm,
		parsed.data.followUpId,
		locals.user!.name,
		parsed.data.body ?? null
	);
	return { ok: true, action: 'sent', undo };
};

const resend: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), resendSchema);
	if (!parsed.ok) return fail(400, { action: 'resend', errors: parsed.errors });
	const undo = await logResend(crm, parsed.data.followUpId, parsed.data.body);
	return { ok: true, action: 'resend', undo };
};

const outcome: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), outcomeSchema);
	if (!parsed.ok) return fail(400, { action: 'outcome', errors: parsed.errors });
	const { followUpId, ...rest } = parsed.data;
	const res = await recordOutcome(crm, followUpId, rest, todayIso());
	if (!res.ok) return fail(400, { action: 'outcome', errors: res.errors });
	return { ok: true, action: 'outcome', nextDate: res.nextDate, undo: res.undo };
};

const snoozeAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), snoozeSchema);
	if (!parsed.ok) return fail(400, { action: 'snooze', errors: parsed.errors });
	const res = await snooze(crm, parsed.data.followUpId, parsed.data.dueDate, todayIso());
	if (!res.ok) return fail(400, { action: 'snooze', errors: res.errors });
	return { ok: true, action: 'snooze', undo: res.undo };
};

const undoOutcomeAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), undoOutcomeSchema);
	if (!parsed.ok) return fail(400, { action: 'undoOutcome', errors: parsed.errors });
	const res = await undoOutcome(crm, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoOutcome', errors: {} });
	return { ok: true, action: 'undoOutcome' };
};

const undoSnoozeAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), undoSnoozeSchema);
	if (!parsed.ok) return fail(400, { action: 'undoSnooze', errors: parsed.errors });
	const res = await undoSnooze(crm, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoSnooze', errors: {} });
	return { ok: true, action: 'undoSnooze' };
};

const undoSentAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), undoSentSchema);
	if (!parsed.ok) return fail(400, { action: 'undoSent', errors: parsed.errors });
	const res = await undoSent(crm, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoSent', errors: {} });
	return { ok: true, action: 'undoSent' };
};

const undoResendAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), undoResendSchema);
	if (!parsed.ok) return fail(400, { action: 'undoResend', errors: parsed.errors });
	const res = await undoResend(crm, parsed.data);
	if (!res.ok) return fail(409, { action: 'undoResend', errors: {} });
	return { ok: true, action: 'undoResend' };
};

const scheduleAction: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), scheduleSchema);
	if (!parsed.ok) return fail(400, { action: 'schedule', errors: parsed.errors });
	const res = await schedule(crm, parsed.data.customerId, parsed.data.dueDate, todayIso());
	if (!res.ok) return fail(res.status, { action: 'schedule', errors: res.errors });
	return { ok: true, action: 'schedule' };
};

const saveTemplate: Action = async ({ request, locals }) => {
	const crm = requireCrm(locals);
	const parsed = parseForm(await request.formData(), saveTemplateSchema);
	if (!parsed.ok) return fail(400, { action: 'saveTemplate', errors: parsed.errors });
	await updateTemplate(crm, parsed.data.kind, parsed.data.body);
	return { ok: true, action: 'saveTemplate' };
};

export const followUpActions = {
	sent,
	resend,
	outcome,
	snooze: snoozeAction,
	undoOutcome: undoOutcomeAction,
	undoSnooze: undoSnoozeAction,
	undoSent: undoSentAction,
	undoResend: undoResendAction,
	schedule: scheduleAction,
	saveTemplate
};
