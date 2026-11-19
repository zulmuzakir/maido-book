import { todayIso } from '#lib/domain/dates.ts';
import { queueCount } from '#lib/server/crm/follow-ups.ts';
import { getRules } from '#lib/server/crm/settings.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { name, email, image } = locals.user!;
	const rules = await getRules(locals.db);
	return {
		user: { name, email, image: image ?? undefined },
		queueCount: await queueCount(locals.db, todayIso(), rules.retryDays)
	};
};
