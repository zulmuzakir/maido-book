import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { env } from 'cloudflare:workers';
import { createAuth } from '#lib/server/auth.ts';
import { getDb } from '#lib/server/db/index.ts';
import { isAllowedEmail, parseAllowedEmails } from '#lib/server/allowed-emails.ts';
import { ALLOWED_EMAILS } from '$app/env/private';
import { svelteKitHandler } from 'better-auth/svelte-kit';

const allowed = parseAllowedEmails(ALLOWED_EMAILS);

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		return resolve(
			{ ...event, request },
			{
				transformPageChunk: ({ html }) =>
					html
						.replace('%paraglide.lang%', locale)
						.replace('%paraglide.dir%', getTextDirection(locale))
			}
		);
	});

const handleAuth: Handle = async ({ event, resolve }) => {
	const d1 = env.DB;
	if (!d1) throw new Error('D1 binding "DB" not found - check d1_databases in wrangler.jsonc');

	event.locals.db = getDb(d1);
	event.locals.auth = createAuth(event.locals.db);

	const found = await event.locals.auth.api.getSession({ headers: event.request.headers });
	const session = found && isAllowedEmail(found.user.email, allowed) ? found : null;
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	const isPublic = event.url.pathname.startsWith('/api/auth/') || event.route.id === '/login';
	if (!session && !isPublic) {
		// A valid Google session whose email left the allowlist gets told why instead of a silent bounce.
		const location = found ? '/login?error=not_allowed' : '/login';
		return new Response(null, { status: 303, headers: { location } });
	}

	return svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
};

export const handle: Handle = sequence(handleParaglide, handleAuth);
