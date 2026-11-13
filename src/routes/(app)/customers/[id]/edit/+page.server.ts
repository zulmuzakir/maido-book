import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { formatPhoneLocal, normalizePhone } from '#lib/domain/phone.ts';
import { resolveDose } from '#lib/server/crm/customer-form.ts';
import { deleteCustomer, getCustomerDetail, updateCustomer } from '#lib/server/crm/customers.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { customerSchema } from '#lib/server/crm/schemas.ts';
import { m } from '#lib/paraglide/messages.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const detail = await getCustomerDetail(locals.db, params.id);
	if (!detail) error(404, 'Not found');

	const { customer: c } = detail;
	return {
		title: m.customer_edit_title(),
		customer: {
			id: c.id,
			name: c.name,
			phone: formatPhoneLocal(c.phone),
			dosePerDay: c.dosePerDay,
			notes: c.notes ?? ''
		}
	};
};

export const actions: Actions = {
	update: async ({ params, request, locals }) => {
		const fd = await request.formData();
		fd.set('dosePerDay', resolveDose(fd));
		const parsed = parseForm(fd, customerSchema);
		if (!parsed.ok) {
			return fail(400, { action: 'update', errors: parsed.errors, values: parsed.values });
		}

		const result = await updateCustomer(locals.db, params.id, parsed.data);
		if ('duplicateOf' in result) {
			const phone = normalizePhone(fd.get('phone'));
			return fail(400, {
				action: 'update',
				errors: { phone: 'duplicate' },
				values: {
					...(Object.fromEntries(fd) as Record<string, string>),
					phone: phone ? formatPhoneLocal(phone) : String(fd.get('phone') ?? '')
				},
				duplicateOf: result.duplicateOf
			});
		}
		redirect(303, `/customers/${params.id}?toast=customer_saved`);
	},

	delete: async ({ params, locals }) => {
		await deleteCustomer(locals.db, params.id);
		redirect(303, '/customers?toast=customer_deleted');
	}
};
