import { todayIso, parseMonthParam } from '#lib/domain/dates.ts';
import { listOrders } from '#lib/server/crm/orders.ts';
import { m } from '#lib/paraglide/messages.js';
import type { PageServerLoad } from './$types';
import { requireCrm } from '#lib/server/crm/scope.ts';

export const load: PageServerLoad = async ({ locals, url }) => {
	const crm = requireCrm(locals);
	const today = todayIso();
	const month = parseMonthParam(url.searchParams.get('month'), today);
	const list = await listOrders(crm, { month });

	return { ...list, month, today, title: m.nav_orders() };
};
