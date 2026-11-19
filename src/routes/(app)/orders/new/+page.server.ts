import { fail, redirect } from '@sveltejs/kit';
import { maxOrderDate, todayIso } from '#lib/domain/dates.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { createOrder, orderFormOptions } from '#lib/server/crm/orders.ts';
import { getRules } from '#lib/server/crm/settings.ts';
import { orderSchema } from '#lib/server/crm/schemas.ts';
import { m } from '#lib/paraglide/messages.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const today = todayIso();
	const [options, rules] = await Promise.all([orderFormOptions(locals.db), getRules(locals.db)]);
	const requested = url.searchParams.get('customer');
	const preselected = options.customers.find((c) => c.id === requested) ?? null;
	// Opened from the queue's "Sudah order": saving and going back both return to the queue.
	const fromQueue = url.searchParams.get('from') === 'queue';

	return {
		customers: options.customers,
		products: options.products,
		rules,
		today,
		maxDate: maxOrderDate(today),
		preselected,
		fromQueue,
		title: m.new_order()
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const today = todayIso();
		const formData = await request.formData();
		const parsed = parseForm(formData, orderSchema);
		if (!parsed.ok) return fail(400, { errors: parsed.errors, values: parsed.values });

		if (parsed.data.orderDate > maxOrderDate(today)) {
			const values = Object.fromEntries(formData) as Record<string, string>;
			const errors: Record<string, string> = { orderDate: 'out_of_range' };
			return fail(400, { errors, values });
		}

		await createOrder(locals.db, parsed.data, locals.user!.id);
		if (formData.get('from') === 'queue') redirect(303, '/?toast=order_saved');
		redirect(303, `/customers/${parsed.data.customerId}?toast=order_saved`);
	}
};
