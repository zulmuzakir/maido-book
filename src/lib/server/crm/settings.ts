import { eq, sql } from 'drizzle-orm';
import { runBatch } from './batch.ts';
import type { Db } from '#lib/server/db/index.ts';
import { messageTemplate, product, setting } from '#lib/server/db/schema.ts';
import { FOLLOW_UP_KINDS, type RuleSettings, type TemplateKind } from '#lib/domain/types.ts';

/** The rules row as a batchable query; read it with `toRules`. */
export const rulesQuery = (db: Db) => db.select().from(setting).where(eq(setting.id, 1));

export function toRules(rows: (typeof setting.$inferSelect)[]): RuleSettings {
	const row = rows[0];
	if (!row) throw new Error('setting row missing - run pnpm db:migrate:local');
	return {
		leadDays: row.leadDays,
		retryDays: row.retryDays,
		maxAttempts: row.maxAttempts,
		winbackDays: row.winbackDays
	};
}

export async function getRules(db: Db): Promise<RuleSettings> {
	return toRules(await rulesQuery(db));
}

export async function updateRules(db: Db, rules: RuleSettings) {
	await db.update(setting).set(rules).where(eq(setting.id, 1));
}

export const templatesQuery = (db: Db) => db.select().from(messageTemplate);

/** Every follow-up kind with its template body ('' when a kind has no row). */
export function toTemplates(
	rows: { kind: TemplateKind; body: string }[]
): Record<TemplateKind, string> {
	const out = Object.fromEntries(FOLLOW_UP_KINDS.map((k) => [k, ''])) as Record<
		TemplateKind,
		string
	>;
	for (const r of rows) out[r.kind] = r.body;
	return out;
}

export async function updateTemplates(db: Db, t: Record<TemplateKind, string>) {
	await runBatch(
		db,
		FOLLOW_UP_KINDS.map((k) =>
			db.update(messageTemplate).set({ body: t[k] }).where(eq(messageTemplate.kind, k))
		)
	);
}

/** Saves one template body and stamps updatedAt. */
export async function updateTemplate(db: Db, kind: TemplateKind, body: string) {
	await db
		.update(messageTemplate)
		.set({ body, updatedAt: new Date() })
		.where(eq(messageTemplate.kind, kind));
}

export type Product = typeof product.$inferSelect;

export const productsQuery = (db: Db, opts: { activeOnly?: boolean } = {}) =>
	db
		.select()
		.from(product)
		.where(opts.activeOnly ? eq(product.active, true) : undefined)
		.orderBy(product.createdAt, product.name);

export async function listProducts(
	db: Db,
	opts: { activeOnly?: boolean } = {}
): Promise<Product[]> {
	return productsQuery(db, opts);
}

export interface ProductInput {
	name: string;
	unitLabel: string;
	servingsPerUnit: number;
	price: number;
	active: boolean;
}

export type ProductResult = { ok: true } | { ok: false; errors: Record<string, string> };

async function validateProduct(db: Db, input: ProductInput, id?: string): Promise<ProductResult> {
	const errors: Record<string, string> = {};
	const dup = await db
		.select({ id: product.id })
		.from(product)
		.where(sql`lower(${product.name}) = lower(${input.name})`)
		.all();
	if (dup.some((d) => d.id !== id)) errors.name = 'duplicate';
	if (id && !input.active) {
		const others = await db
			.select({ id: product.id })
			.from(product)
			.where(sql`${product.active} = 1 and ${product.id} != ${id}`)
			.limit(1)
			.all();
		if (others.length === 0) errors.active = 'last_active';
	}
	return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

export async function createProduct(db: Db, input: ProductInput): Promise<ProductResult> {
	const res = await validateProduct(db, input);
	if (!res.ok) return res;
	await db.insert(product).values(input);
	return { ok: true };
}

export async function updateProduct(
	db: Db,
	id: string,
	input: ProductInput
): Promise<ProductResult> {
	const res = await validateProduct(db, input, id);
	if (!res.ok) return res;
	await db.update(product).set(input).where(eq(product.id, id));
	return { ok: true };
}
