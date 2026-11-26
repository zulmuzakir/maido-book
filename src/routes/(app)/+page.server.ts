import { todayIso } from '#lib/domain/dates.ts';
import { waLink } from '#lib/domain/phone.ts';
import { countOf } from '#lib/server/crm/batch.ts';
import {
	defaultProductQuery,
	doneTodayQuery,
	handledQuery,
	messageFor,
	queueQuery,
	templateVars,
	toHandled,
	toMessageContext,
	toQueue,
	type QueueItem
} from '#lib/server/crm/follow-ups.ts';
import { rulesQuery, templatesQuery, toRules } from '#lib/server/crm/settings.ts';
import { hasCustomersQuery } from '#lib/server/crm/customers.ts';
import { followUpActions } from '#lib/server/crm/follow-up-actions.ts';
import { m } from '#lib/paraglide/messages.js';
import type { PageServerLoad } from './$types';
import { requireCrm } from '#lib/server/crm/scope.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const crm = requireCrm(locals);
	const today = todayIso();

	// One D1 round trip for the whole page.
	const [queueRows, ruleRows, doneRows, handledRows, templateRows, productRows, customerRows] =
		await crm.db.batch([
			queueQuery(crm, today),
			rulesQuery(crm),
			doneTodayQuery(crm, today),
			handledQuery(crm, today),
			templatesQuery(crm),
			defaultProductQuery(crm),
			hasCustomersQuery(crm)
		]);
	const queue = toQueue(queueRows, today);
	const rules = toRules(ruleRows);
	const doneToday = countOf(doneRows);
	const handled = toHandled(handledRows);
	const ctx = toMessageContext(templateRows, productRows);
	const anyCustomer = customerRows.length > 0;
	const csName = locals.user!.name;

	const withWaUrl = (item: QueueItem) => {
		const vars = templateVars(ctx, item.customer, item.lastOrder, csName);
		const message = messageFor(ctx, item, item.customer, item.lastOrder, csName);
		return { ...item, message, vars, waUrl: waLink(item.customer.phone, message) };
	};

	return {
		title: m.nav_today(),
		today,
		hasCustomers: anyCustomer,
		rules,
		doneToday,
		handled,
		overdue: queue.overdue.map(withWaUrl),
		dueToday: queue.today.map(withWaUrl),
		waiting: queue.waiting.map(withWaUrl),
		upcoming: queue.upcoming.map(withWaUrl)
	};
};

export const actions = { ...followUpActions };
