import { json } from '@sveltejs/kit';
import { searchCustomerOptions } from '#lib/server/crm/customers.ts';
import type { RequestHandler } from './$types';
import { requireCrm } from '#lib/server/crm/scope.ts';

/** The new-order picker's customer search (`?q=` name or phone). Signed-in only, via the hook. */
export const GET: RequestHandler = async ({ locals, url }) => {
	const crm = requireCrm(locals);
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
	return json(await searchCustomerOptions(crm, q));
};
