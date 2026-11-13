import type { PageServerLoad } from './$types';
import { m } from '#lib/paraglide/messages.js';
import { parseMonthParam, todayIso } from '#lib/domain/dates.ts';
import { getInsights } from '#lib/server/crm/insights.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const today = todayIso();
	const month = parseMonthParam(url.searchParams.get('month'), today);
	return {
		title: m.nav_insights(),
		today,
		month,
		insights: await getInsights(locals.db, today, month)
	};
};
