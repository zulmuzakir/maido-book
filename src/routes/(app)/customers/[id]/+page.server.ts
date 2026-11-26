import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '#lib/domain/dates.ts';
import { waLink } from '#lib/domain/phone.ts';
import { addNote, customerDetailQueries, toCustomerDetail } from '#lib/server/crm/customers.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { followUpActions } from '#lib/server/crm/follow-up-actions.ts';
import {
	defaultProductQuery,
	messageFor,
	templateVars,
	toMessageContext
} from '#lib/server/crm/follow-ups.ts';
import { deleteOrder } from '#lib/server/crm/orders.ts';
import { noteSchema } from '#lib/server/crm/schemas.ts';
import { rulesQuery, templatesQuery, toRules } from '#lib/server/crm/settings.ts';
import { requireCrm } from '#lib/server/crm/scope.ts';

export const load: PageServerLoad = async ({ params, locals }) => {
	const crm = requireCrm(locals);

	// One D1 round trip: the customer's detail, the rules and the message context.
	const [c0, fu, last, orderRows, activityRows, ruleRows, templateRows, productRows] =
		await crm.db.batch([
			...customerDetailQueries(crm, params.id),
			rulesQuery(crm),
			templatesQuery(crm),
			defaultProductQuery(crm)
		]);
	const detail = toCustomerDetail([c0, fu, last, orderRows, activityRows]);
	if (!detail) error(404, 'Not found');

	const { customer: c, openFollowUp, lastOrder, orders, activities } = detail;
	const rules = toRules(ruleRows);
	const ctx = toMessageContext(templateRows, productRows);
	const today = todayIso();
	const csName = locals.user!.name;

	const message = openFollowUp ? messageFor(ctx, openFollowUp, c, lastOrder, csName) : '';
	const panelItem = openFollowUp
		? {
				followUpId: openFollowUp.id,
				kind: openFollowUp.kind,
				dueDate: openFollowUp.dueDate,
				attempt: openFollowUp.attempt,
				contactedAt: openFollowUp.contactedAt,
				message,
				vars: templateVars(ctx, c, lastOrder, csName),
				waUrl: waLink(c.phone, message),
				customer: {
					id: c.id,
					name: c.name,
					phone: c.phone,
					dosePerDay: c.dosePerDay,
					status: c.status
				},
				lastOrder
			}
		: null;

	return {
		title: c.name,
		customer: {
			id: c.id,
			name: c.name,
			phone: c.phone,
			status: c.status,
			dosePerDay: c.dosePerDay,
			notes: c.notes
		},
		openFollowUp,
		panelItem,
		orders,
		activities,
		ordersTruncated: detail.ordersTruncated,
		activitiesTruncated: detail.activitiesTruncated,
		today,
		rules
	};
};

export const actions: Actions = {
	...followUpActions,

	note: async ({ params, request, locals }) => {
		const crm = requireCrm(locals);
		const parsed = parseForm(await request.formData(), noteSchema);
		if (!parsed.ok) return fail(400, { action: 'note', errors: parsed.errors });
		await addNote(crm, params.id, parsed.data.body);
		return { ok: true, action: 'note' };
	},

	deleteOrder: async ({ params, request, locals }) => {
		const crm = requireCrm(locals);
		const orderId = (await request.formData()).get('orderId');
		if (typeof orderId !== 'string' || !orderId) {
			return fail(400, { action: 'deleteOrder', errors: { orderId: 'required' } });
		}
		await deleteOrder(crm, params.id, orderId);
		return { ok: true, action: 'deleteOrder' };
	}
};
