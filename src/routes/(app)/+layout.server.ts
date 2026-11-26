import { todayIso } from '#lib/domain/dates.ts';
import { queueCount } from '#lib/server/crm/follow-ups.ts';
import type { LayoutServerLoad } from './$types';
import { requireCrm } from '#lib/server/crm/scope.ts';

export const load: LayoutServerLoad = async ({ locals }) => {
	const crm = requireCrm(locals);
	const { name, email, image } = locals.user!;
	return {
		user: { name, email, image: image ?? undefined },
		queueCount: await queueCount(crm, todayIso())
	};
};
