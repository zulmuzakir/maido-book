import { redirect } from '@sveltejs/kit';
import { todayIso } from '#lib/domain/dates.ts';
import { countCustomersByFilter, listCustomers } from '#lib/server/crm/customers.ts';
import { getRules } from '#lib/server/crm/settings.ts';
import { m } from '#lib/paraglide/messages.js';
import type { PageServerLoad } from './$types';

const STATUSES = ['all', 'interested', 'lead', 'active', 'dormant'] as const;
const PAGE_SIZE = 30;

export const load: PageServerLoad = async ({ locals, url }) => {
	const rawStatus = url.searchParams.get('status');
	const status = STATUSES.find((s) => s === rawStatus) ?? 'all';
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const today = todayIso();

	const [result, counts, rules] = await Promise.all([
		listCustomers(locals.db, { q, status, page, pageSize: PAGE_SIZE }),
		countCustomersByFilter(locals.db, q),
		getRules(locals.db)
	]);

	// A stale link (or the last row on a page was deleted) points past the end: go to the last page.
	const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
	if (page > lastPage) {
		const target = new URL(url);
		if (lastPage === 1) target.searchParams.delete('page');
		else target.searchParams.set('page', String(lastPage));
		redirect(307, `${target.pathname}${target.search}`);
	}

	return {
		title: m.nav_customers(),
		items: result.items,
		counts,
		total: result.total,
		q,
		status,
		page,
		pageSize: PAGE_SIZE,
		today,
		leadDays: rules.leadDays
	};
};
