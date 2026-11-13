import {
	ORIGIN,
	BETTER_AUTH_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	ALLOWED_EMAILS
} from '$app/env/private';
import { APIError } from 'better-auth/api';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { isAllowedEmail, parseAllowedEmails } from '#lib/server/allowed-emails.ts';
import type { Db } from '#lib/server/db/index.ts';

const allowed = parseAllowedEmails(ALLOWED_EMAILS);

export const createAuth = (db: Db) =>
	betterAuth({
		baseURL: ORIGIN,
		secret: BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, { provider: 'sqlite' }),
		// createAuth runs per request; skip the per-instance schema introspection (migrations own the schema)
		advanced: { database: { validateSchema: false } },
		socialProviders: {
			google: {
				clientId: GOOGLE_CLIENT_ID,
				clientSecret: GOOGLE_CLIENT_SECRET,
				prompt: 'select_account'
			}
		},
		databaseHooks: {
			user: {
				create: {
					before: async (user) => {
						if (!isAllowedEmail(user.email, allowed))
							throw new APIError('FORBIDDEN', { message: 'Email not allowed' });
					}
				}
			}
		},
		plugins: [sveltekitCookies(getRequestEvent)] // must stay last
	});

export type Auth = ReturnType<typeof createAuth>;

/** Used ONLY by the `auth` CLI (`pnpm auth:schema`). At runtime use `event.locals.auth`. */
export const auth = createAuth(null!);
