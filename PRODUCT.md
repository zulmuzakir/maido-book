# Product

## Platform

web

## Users

A small Indonesian customer-service (CS) team following up with buyers of a consumable product, mostly over WhatsApp. They work from a daily follow-up queue, on desktop and phone. Access is internal only: Google sign-in limited to the `ALLOWED_EMAILS` allowlist. Whether owners or managers also use Insights is undecided.

## Product Purpose

A CS follow-up CRM. Each order records quantity and servings, and the app computes when the customer will run out and schedules the next reorder follow-up. The CS team clears that queue each day, logs outcomes, and keeps customers buying. Success: no customer silently runs out without a timely, personal follow-up.

## Positioning

Run-out prediction plus a WhatsApp-first workflow. The follow-up date is derived from the product's real consumption (`orderDate + max(0, ceil(qty × servingsPerUnit / dosePerDay) − leadDays)`), not set by hand, and the follow-up is sent through WhatsApp from templates.

## Operating Context

- Daily queue at `/` bucketed: overdue, today, waiting for reply, next 7 days.
- Follow-up kinds: reorder reminder, follow-up, new lead, win-back, closing.
- Outcomes: ordered, replied, interested, no reply, not interested; snooze is available.
- Customer status: lead, active, dormant. One open follow-up per customer.
- Customers, orders, insights, settings (products, rules, WhatsApp templates), and Excel import of the existing CS spreadsheet (`/import`).
- Dates are `YYYY-MM-DD` in Asia/Jakarta.

## Capabilities and Constraints

- SvelteKit 3 / Svelte 5 on Cloudflare Workers with D1; better-auth Google sign-in.
- Two locales, Indonesian (default) and English, via Paraglide. All UI strings go in `messages/{id,en}.json`.
- shadcn-svelte components, Tailwind v4, light/dark/system theme.
- Early stage. Multi-tenant or public use is not planned.
- Open decision: whether an owner or manager uses Insights to oversee the team, or only the CS team reads it.

## Brand Commitments

The product name is **Maido Book** (confirmed; in `messages/{id,en}.json` as `app_name`). The Worker is `maido-book` and the D1 database `maido-book-db`. No logo, voice guide, or other brand assets exist yet.

## Evidence on Hand

No testimonials, customer logos, benchmarks, or brand assets are in the repo. Do not fabricate any of these.

## Product Principles

- The daily queue is the product; everything serves clearing it quickly and correctly.
- Computed dates over manual ones: derive follow-ups from consumption.
- WhatsApp is the working channel; sending should be one step away.
- Indonesian first, English equal; no hardcoded strings.
- Fast on a phone as well as at a desk.

## Accessibility & Inclusion

No product-specific standard established. Both locales must be fully supported.
