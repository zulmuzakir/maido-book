import { json } from '@sveltejs/kit';
import { searchCustomerOptions } from '#lib/server/crm/customers.ts';
import type { RequestHandler } from './$types';

/** The new-order picker's customer search (`?q=` name or phone). Signed-in only, via the hook. */
export const GET: RequestHandler = async ({ locals, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 60);
	return json(await searchCustomerOptions(locals.db, q));
};
