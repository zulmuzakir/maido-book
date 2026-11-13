import { todayIso } from '#lib/domain/dates.ts';
import { waLink } from '#lib/domain/phone.ts';
import {
	getQueue,
	handledToday,
	messageContext,
	messageFor,
	templateVars,
	sentTodayCount,
	type QueueItem
} from '#lib/server/crm/follow-ups.ts';
import { getRules } from '#lib/server/crm/settings.ts';
import { followUpActions } from '#lib/server/crm/follow-up-actions.ts';
import { m } from '#lib/paraglide/messages.js';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const today = todayIso();
	const [queue, rules, sentToday, handled, ctx] = await Promise.all([
		getQueue(locals.db, today),
		getRules(locals.db),
		sentTodayCount(locals.db, today),
		handledToday(locals.db, today),
		messageContext(locals.db)
	]);
	const csName = locals.user!.name;

	const withWaUrl = (item: QueueItem) => {
		const vars = templateVars(ctx, item.customer, item.lastOrder, csName);
		const message = messageFor(ctx, item, item.customer, item.lastOrder, csName);
		return { ...item, message, vars, waUrl: waLink(item.customer.phone, message) };
	};

	return {
		title: m.nav_today(),
		today,
		rules,
		sentToday,
		handled,
		overdue: queue.overdue.map(withWaUrl),
		dueToday: queue.today.map(withWaUrl),
		waiting: queue.waiting.map(withWaUrl),
		upcoming: queue.upcoming.map(withWaUrl)
	};
};

export const actions = { ...followUpActions };
