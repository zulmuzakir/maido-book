import { eq, sql } from 'drizzle-orm';
import { runBatch } from './batch.ts';
import type { Db } from '#lib/server/db/index.ts';
import { messageTemplate, product, setting } from '#lib/server/db/schema.ts';
import { FOLLOW_UP_KINDS, type RuleSettings, type TemplateKind } from '#lib/domain/types.ts';

export async function getRules(db: Db): Promise<RuleSettings> {
	const row = await db.select().from(setting).where(eq(setting.id, 1)).get();
	if (!row) throw new Error('setting row missing - run pnpm db:migrate:local');
	return {
		leadDays: row.leadDays,
		retryDays: row.retryDays,
		maxAttempts: row.maxAttempts,
		winbackDays: row.winbackDays
	};
}

export async function updateRules(db: Db, rules: RuleSettings) {
	await db.update(setting).set(rules).where(eq(setting.id, 1));
}

export async function getTemplates(db: Db): Promise<Record<TemplateKind, string>> {
	const rows = await db.select().from(messageTemplate);
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

export async function listProducts(
	db: Db,
	opts: { activeOnly?: boolean } = {}
): Promise<Product[]> {
	const q = db.select().from(product);
	const rows = await (opts.activeOnly ? q.where(eq(product.active, true)) : q).orderBy(
		product.createdAt,
		product.name
	);
	return rows;
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
