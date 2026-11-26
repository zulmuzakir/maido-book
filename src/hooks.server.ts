import { getTextDirection } from '#lib/paraglide/runtime.js';
import { paraglideMiddleware } from '#lib/paraglide/server.js';
import { type Handle, sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/env';
import { env } from 'cloudflare:workers';
import { createAuth } from '#lib/server/auth.ts';
import { getDb } from '#lib/server/db/index.ts';
import { instrumentD1, newDbStats, serverTiming } from '#lib/server/db/timing.ts';
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

/** Adds a header, copying the response first when its headers are immutable. */
function withHeader(response: Response, name: string, value: string): Response {
	try {
		response.headers.set(name, value);
		return response;
	} catch {
		const copy = new Response(response.body, response);
		copy.headers.set(name, value);
		return copy;
	}
}

const handleAuth: Handle = async ({ event, resolve }) => {
	const started = performance.now();
	const d1 = env.DB;
	if (!d1) throw new Error('D1 binding "DB" not found - check d1_databases in wrangler.jsonc');

	// Server-Timing reports the D1 round trips each request makes (DevTools → Network → Timing).
	const stats = newDbStats();
	const spans: { name: string; ms: number; desc?: string }[] = [];
	const timed = (response: Response) => {
		spans.push(
			{ name: 'db', ms: stats.ms, desc: `${stats.trips} trips` },
			{ name: 'total', ms: performance.now() - started }
		);
		return withHeader(response, 'Server-Timing', serverTiming(spans));
	};

	event.locals.db = getDb(instrumentD1(d1, stats));
	let mark = performance.now();
	event.locals.auth = createAuth(event.locals.db);
	spans.push({ name: 'auth-init', ms: performance.now() - mark });

	mark = performance.now();
	const tripsBefore = stats.trips;
	const found = await event.locals.auth.api.getSession({ headers: event.request.headers });
	spans.push({
		name: 'session',
		ms: performance.now() - mark,
		desc: `${stats.trips - tripsBefore} trips`
	});
	const session = found && isAllowedEmail(found.user.email, allowed) ? found : null;
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
		event.locals.crm = { db: event.locals.db, ownerId: session.user.id };
	}

	const isPublic = event.url.pathname.startsWith('/api/auth/') || event.route.id === '/login';
	if (!session && !isPublic) {
		// A valid Google session whose email left the allowlist gets told why instead of a silent bounce.
		const location = found ? '/login?error=not_allowed' : '/login';
		return timed(new Response(null, { status: 303, headers: { location } }));
	}

	const response = await svelteKitHandler({ event, resolve, auth: event.locals.auth, building });
	const route = event.route.id;
	return timed(
		session && (route === '/(app)' || route?.startsWith('/(app)/'))
			? withHeader(response, 'Cache-Control', 'private, no-store')
			: response
	);
};

export const handle: Handle = sequence(handleParaglide, handleAuth);
