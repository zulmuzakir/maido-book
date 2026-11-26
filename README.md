# Maido Book

A customer-service follow-up CRM for a consumable product. It has a daily follow-up queue, customers, orders that schedule the next reorder follow-up, insights, settings (products, rules, WhatsApp templates) and Excel import. WhatsApp messages are sent through `wa.me` links. The UI is in Indonesian (default) and English.

Each allowlisted Google account has a private CRM. Products, follow-up rules and WhatsApp templates
start with defaults and can be edited independently.

## Stack

- SvelteKit 3 / Svelte 5 (runes)
- Cloudflare Workers + D1 (SQLite)
- Drizzle ORM, with migrations in `drizzle/`
- better-auth with Google sign-in, limited to an email allowlist
- Paraglide for i18n (`id`, `en`)
- Tailwind CSS v4 + shadcn-svelte

## Prerequisites

- Node.js and pnpm. The repo uses pnpm only (`engineStrict: true` in `pnpm-workspace.yaml`).
- A Cloudflare account, with wrangler logged in (`pnpm exec wrangler login`).
- A Google OAuth client (Google Cloud console).
- Network access during install and build: Paraglide loads its inlang plugins from a CDN.

## Local setup

1. Install dependencies. This also compiles messages, generates worker types and sets up the git hooks.

   ```sh
   pnpm install
   ```

2. Copy the env file and fill it in:

   ```sh
   cp .env.example .env
   ```

   | Variable               | Purpose                                                                                          |
   | ---------------------- | ------------------------------------------------------------------------------------------------ |
   | `ORIGIN`               | App base URL, `http://localhost:5173` for local dev                                              |
   | `BETTER_AUTH_SECRET`   | Secret used to sign tokens. In production use 32 characters generated with high entropy          |
   | `GOOGLE_CLIENT_ID`     | Google OAuth client ID                                                                           |
   | `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                                                                       |
   | `ALLOWED_EMAILS`       | Comma-separated Google account emails allowed to sign in (case-insensitive). Empty allows nobody |

   Register `<ORIGIN>/api/auth/callback/google` as an authorized redirect URI on the Google OAuth client (`http://localhost:5173/api/auth/callback/google` locally). Put your own Google email in `ALLOWED_EMAILS`, or you cannot sign in.

3. Apply the migrations to the local D1 database:

   ```sh
   pnpm db:migrate:local
   ```

   If `0005_personal_crm` reports `legacy_crm_requires_explicit_ownership`, keep that database
   intact. Shared CRM records are not assigned to any account automatically. To use a separate
   local database, apply migrations with
   `pnpm db:migrate:local --persist-to <directory>` and pass the same `--persist-to` to Wrangler dev.

4. Start the dev server at http://localhost:5173:

   ```sh
   pnpm dev
   ```

5. Optional: after signing in once, load demo customers, orders and follow-ups into that account.
   Reseeding replaces only that account's fixtures and refuses to overwrite linked non-demo work.
   Set `D1_LOCAL_PERSIST_TO` if you used a separate persistence directory.

   ```sh
   pnpm db:seed:local you@example.com
   ```

## Common scripts

| Script                       | Runs                                                                    |
| ---------------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`                   | `vite dev`                                                              |
| `pnpm check`                 | `wrangler types`, `svelte-kit sync`, `svelte-check` (type check)        |
| `pnpm lint`                  | `prettier --check .` and `eslint .`                                     |
| `pnpm format`                | `prettier --write .`                                                    |
| `pnpm test`                  | `vitest --run` (`pnpm test:unit` for watch mode)                        |
| `pnpm build`                 | `wrangler types` and `vite build`                                       |
| `pnpm preview`               | `wrangler dev` on the built worker, port 4173                           |
| `pnpm db:generate`           | `drizzle-kit generate`: new SQL migration in `drizzle/` from the schema |
| `pnpm db:migrate:local`      | Apply migrations to the local `maido-book-db`                           |
| `pnpm db:migrate:remote`     | Apply migrations to the remote `maido-book-db`                          |
| `pnpm db:seed:local <email>` | Load demo data for an existing local account                            |
| `pnpm deploy`                | `pnpm build` and `wrangler deploy`                                      |

Run `pnpm check`, `pnpm lint` and `pnpm test` before committing.

## Deploy

The worker is `maido-book`. `wrangler.jsonc` binds `DB` to the D1 database `maido-book-db` and applies migrations from `drizzle/`.

1. Apply the migrations to the remote database:

   ```sh
   pnpm db:migrate:remote
   ```

2. Set each secret on the worker:

   ```sh
   pnpm exec wrangler secret put ORIGIN
   pnpm exec wrangler secret put BETTER_AUTH_SECRET
   pnpm exec wrangler secret put GOOGLE_CLIENT_ID
   pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET
   pnpm exec wrangler secret put ALLOWED_EMAILS
   ```

   `ORIGIN` is the production URL. The production Google OAuth client must list `<production ORIGIN>/api/auth/callback/google` as a redirect URI.

3. Build and deploy:

   ```sh
   pnpm deploy
   ```

## Project structure

```
src/routes/       pages and form actions; (app)/ is the signed-in area, plus login/ and logout/
src/lib/domain/   pure, client-safe domain logic (follow-up dates, templates) with tests
src/lib/server/   server-only code: auth, D1/Drizzle schema, CRM queries
messages/         translations (id.json, en.json)
drizzle/          SQL migrations applied by wrangler D1
```

See [AGENTS.md](AGENTS.md) for architecture and conventions, [PRODUCT.md](PRODUCT.md) for product context and [DESIGN.md](DESIGN.md) for the design system.

## License

[MIT](LICENSE)
