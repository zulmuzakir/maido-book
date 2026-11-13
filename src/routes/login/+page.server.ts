import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) return redirect(302, '/');
	return {};
};

export const actions: Actions = {
	google: async ({ locals }) => {
		const result = await locals.auth.api.signInSocial({
			body: { provider: 'google', callbackURL: '/', errorCallbackURL: '/login' }
		});
		if (result.url) return redirect(302, result.url, { external: ['https://accounts.google.com'] });
		return fail(500, { failed: true });
	}
};
