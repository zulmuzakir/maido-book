import { fail, redirect } from '@sveltejs/kit';
import { isIsoDate, maxOrderDate, todayIso } from '#lib/domain/dates.ts';
import { parseForm } from '#lib/server/crm/form.ts';
import { customerOptionQuery } from '#lib/server/crm/customers.ts';
import { createOrder } from '#lib/server/crm/orders.ts';
import { productsQuery, rulesQuery, toRules } from '#lib/server/crm/settings.ts';
import { orderSchema } from '#lib/server/crm/schemas.ts';
import { m } from '#lib/paraglide/messages.js';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const today = todayIso();
	const db = locals.db;
	// Customers are searched from the picker (orders/new/customers); only a preselected one loads here.
	const [products, ruleRows, preselectedRows] = await db.batch([
		productsQuery(db, { activeOnly: true }),
		rulesQuery(db),
		customerOptionQuery(db, url.searchParams.get('customer') ?? '')
	]);
	const preselected = preselectedRows[0] ?? null;
	// Opened from the queue's "Sudah order": saving and going back both return to the queue.
	const fromQueue = url.searchParams.get('from') === 'queue';

	return {
		products,
		rules: toRules(ruleRows),
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
		const tooLate = (date: unknown) =>
			typeof date === 'string' && isIsoDate(date) && date > maxOrderDate(today);
		if (!parsed.ok) {
			// Report a date beyond tomorrow with the other field errors, not one save later.
			const errors =
				!parsed.errors.orderDate && tooLate(formData.get('orderDate'))
					? { ...parsed.errors, orderDate: 'out_of_range' }
					: parsed.errors;
			return fail(400, { errors, values: parsed.values });
		}

		if (tooLate(parsed.data.orderDate)) {
			const values = Object.fromEntries(formData) as Record<string, string>;
			const errors: Record<string, string> = { orderDate: 'out_of_range' };
			return fail(400, { errors, values });
		}

		await createOrder(locals.db, parsed.data, locals.user!.id);
		if (formData.get('from') === 'queue') redirect(303, '/?toast=order_saved');
		redirect(303, `/customers/${parsed.data.customerId}?toast=order_saved`);
	}
};
