import { fail } from '@sveltejs/kit';
import * as v from 'valibot';
import { todayIso } from '#lib/domain/dates.ts';
import { m } from '#lib/paraglide/messages.js';
import { existingPhones, importCustomers, importRowsSchema } from '#lib/server/crm/import.ts';
import { getRules } from '#lib/server/crm/settings.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [rules, phones] = await Promise.all([getRules(locals.db), existingPhones(locals.db)]);
	return { rules, existingPhones: phones, today: todayIso(), title: m.import_title() };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const form = await request.formData();
		const raw = form.get('rows');
		if (typeof raw !== 'string') return fail(400, { invalid: true });

		let json: unknown;
		try {
			json = JSON.parse(raw);
		} catch {
			return fail(400, { invalid: true });
		}

		const parsed = v.safeParse(importRowsSchema, json);
		if (!parsed.success) return fail(400, { invalid: true });

		const result = await importCustomers(locals.db, parsed.output, locals.user!.id, todayIso());
		if (result.imported === 0) return fail(400, { empty: true });
		const count = (k: string) => {
			const n = Number(form.get(k));
			return Number.isInteger(n) && n >= 0 && n <= 10000 ? n : 0;
		};
		return {
			ok: true as const,
			imported: result.imported,
			skippedExisting: result.skippedExisting + count('skippedExisting'),
			skippedInvalid: result.skippedInvalid + count('skippedInvalid')
		};
	}
};
