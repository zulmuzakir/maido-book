import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todayIso } from '#lib/domain/dates.ts';
import { formatPhoneNational, normalizePhone } from '#lib/domain/phone.ts';
import { resolveDose } from '#lib/server/crm/customer-form.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { customerSchema } from '#lib/server/crm/schemas.ts';
import { createCustomer, customerSnapshot } from '#lib/server/crm/customers.ts';
import { m } from '#lib/paraglide/messages.js';

export const load: PageServerLoad = async ({ url }) => {
	const next = url.searchParams.get('next') === 'order' ? 'order' : '';
	return { title: m.customer_new_title(), next, today: todayIso() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const fd = await request.formData();
		fd.set('dosePerDay', resolveDose(fd));
		const parsed = parseForm(fd, customerSchema);
		if (!parsed.ok) {
			return fail(400, { errors: parsed.errors, values: parsed.values });
		}

		const result = await createCustomer(locals.db, parsed.data, locals.user!.id, todayIso());
		if ('duplicateOf' in result) {
			const existing = await customerSnapshot(locals.db, result.duplicateOf.id);
			const phone = normalizePhone(fd.get('phone'));
			return fail(400, {
				errors: { phone: 'duplicate' },
				values: {
					...(Object.fromEntries(fd) as Record<string, string>),
					phone: phone ? formatPhoneNational(phone) : String(fd.get('phone') ?? '')
				},
				duplicateOf: existing
			});
		}

		// `next` is the "Simpan & buat order" submit button; `from` carries the URL's ?next=order.
		const wantsOrder = fd.get('next') === 'order' || fd.get('from') === 'order';
		redirect(
			303,
			wantsOrder
				? `/orders/new?customer=${result.id}`
				: `/customers/${result.id}?toast=customer_saved`
		);
	}
};
