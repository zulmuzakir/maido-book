import { redirect } from '@sveltejs/kit';
import { todayIso } from '#lib/domain/dates.ts';
import {
	customerFilterCountsQuery,
	listCustomersQueries,
	toCustomerFilterCounts,
	toCustomerList
} from '#lib/server/crm/customers.ts';
import { rulesQuery, toRules } from '#lib/server/crm/settings.ts';
import { m } from '#lib/paraglide/messages.js';
import type { PageServerLoad } from './$types';

const STATUSES = ['all', 'interested', 'lead', 'active', 'dormant'] as const;
const PAGE_SIZE = 30;
/** Rows the phone's "Muat 30 lainnya" can grow the list to. */
const MAX_ROWS = 300;

export const load: PageServerLoad = async ({ locals, url }) => {
	const rawStatus = url.searchParams.get('status');
	const status = STATUSES.find((s) => s === rawStatus) ?? 'all';
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
	const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	// `n` is the phone's grown list: the first n rows on one page, so reload and Back keep them.
	const n = Number.parseInt(url.searchParams.get('n') ?? '', 10);
	const pageSize =
		n > PAGE_SIZE ? Math.min(MAX_ROWS, Math.ceil(n / PAGE_SIZE) * PAGE_SIZE) : PAGE_SIZE;
	const today = todayIso();

	const db = locals.db;
	const [totalRows, rows, countRows, ruleRows] = await db.batch([
		...listCustomersQueries(db, { q, status, page, pageSize }),
		customerFilterCountsQuery(db, q),
		rulesQuery(db)
	]);
	const result = toCustomerList(totalRows, rows);
	const counts = toCustomerFilterCounts(countRows);
	const rules = toRules(ruleRows);

	// A stale link (or the last row on a page was deleted) points past the end: go to the last page.
	const lastPage = Math.max(1, Math.ceil(result.total / pageSize));
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
		pageSize,
		step: PAGE_SIZE,
		today,
		leadDays: rules.leadDays
	};
};
