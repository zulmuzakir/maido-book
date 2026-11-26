import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '#lib/domain/dates.ts';
import { formatPhoneNational, normalizePhone } from '#lib/domain/phone.ts';
import { resolveDose } from '#lib/server/crm/customer-form.ts';
import {
	customerSnapshot,
	deleteCustomer,
	getCustomerDetail,
	snapshotOf,
	updateCustomer
} from '#lib/server/crm/customers.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { customerSchema } from '#lib/server/crm/schemas.ts';
import { m } from '#lib/paraglide/messages.js';
import { requireCrm } from '#lib/server/crm/scope.ts';

export const load: PageServerLoad = async ({ params, locals }) => {
	const crm = requireCrm(locals);
	const detail = await getCustomerDetail(crm, params.id);
	if (!detail) error(404, 'Not found');

	const c = detail.customer;
	return {
		summary: snapshotOf(detail),
		today: todayIso(),
		title: m.customer_edit_title(),
		customer: {
			id: c.id,
			name: c.name,
			phone: formatPhoneNational(c.phone),
			dosePerDay: c.dosePerDay,
			notes: c.notes ?? ''
		}
	};
};

export const actions: Actions = {
	update: async ({ params, request, locals }) => {
		const crm = requireCrm(locals);
		const fd = await request.formData();
		fd.set('dosePerDay', resolveDose(fd));
		const parsed = parseForm(fd, customerSchema);
		if (!parsed.ok) {
			return fail(400, { action: 'update', errors: parsed.errors, values: parsed.values });
		}

		const result = await updateCustomer(crm, params.id, parsed.data);
		if ('duplicateOf' in result) {
			const existing = await customerSnapshot(crm, result.duplicateOf.id);
			const phone = normalizePhone(fd.get('phone'));
			return fail(400, {
				action: 'update',
				errors: { phone: 'duplicate' },
				values: {
					...(Object.fromEntries(fd) as Record<string, string>),
					phone: phone ? formatPhoneNational(phone) : String(fd.get('phone') ?? '')
				},
				duplicateOf: existing
			});
		}
		redirect(303, `/customers/${params.id}?toast=customer_saved`);
	},

	delete: async ({ params, locals }) => {
		const crm = requireCrm(locals);
		await deleteCustomer(crm, params.id);
		redirect(303, '/customers?toast=customer_deleted');
	}
};
