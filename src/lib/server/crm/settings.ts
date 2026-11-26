import { eq, getTableColumns, sql } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import { runBatch } from './batch.ts';
import { owned, type CrmScope } from './scope.ts';
import { messageTemplate, product, setting } from '#lib/server/db/schema.ts';
import { FOLLOW_UP_KINDS, type RuleSettings, type TemplateKind } from '#lib/domain/types.ts';

/** The rules row as a batchable query; read it with `toRules`. */
export const rulesQuery = (crm: CrmScope) =>
	crm.db.select().from(setting).where(owned(crm, setting.ownerId));

export function toRules(rows: readonly RuleSettings[]): RuleSettings {
	const row = rows[0];
	if (!row) throw new Error('setting row missing - run pnpm db:migrate:local');
	return {
		leadDays: row.leadDays,
		retryDays: row.retryDays,
		maxAttempts: row.maxAttempts,
		winbackDays: row.winbackDays
	};
}

export async function getRules(crm: CrmScope): Promise<RuleSettings> {
	return toRules(await rulesQuery(crm));
}

export async function updateRules(crm: CrmScope, rules: RuleSettings) {
	await crm.db.update(setting).set(rules).where(owned(crm, setting.ownerId));
}

export const templatesQuery = (crm: CrmScope) =>
	crm.db.select().from(messageTemplate).where(owned(crm, messageTemplate.ownerId));

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

export async function updateTemplates(crm: CrmScope, t: Record<TemplateKind, string>) {
	await runBatch(
		crm.db,
		FOLLOW_UP_KINDS.map((k) =>
			crm.db
				.update(messageTemplate)
				.set({ body: t[k] })
				.where(owned(crm, messageTemplate.ownerId, eq(messageTemplate.kind, k)))
		)
	);
}

/** Saves one template body and stamps updatedAt. */
export async function updateTemplate(crm: CrmScope, kind: TemplateKind, body: string) {
	await crm.db
		.update(messageTemplate)
		.set({ body, updatedAt: new Date() })
		.where(owned(crm, messageTemplate.ownerId, eq(messageTemplate.kind, kind)));
}

export type Product = Omit<typeof product.$inferSelect, 'ownerId'>;

const { ownerId: productOwner, ...productFields } = getTableColumns(product);

export const productsQuery = (crm: CrmScope, opts: { activeOnly?: boolean } = {}) =>
	crm.db
		.select(productFields)
		.from(product)
		.where(owned(crm, productOwner, opts.activeOnly ? eq(product.active, true) : undefined))
		.orderBy(product.createdAt, product.name);

export async function listProducts(
	crm: CrmScope,
	opts: { activeOnly?: boolean } = {}
): Promise<Product[]> {
	return productsQuery(crm, opts);
}

export interface ProductInput {
	name: string;
	unitLabel: string;
	servingsPerUnit: number;
	price: number;
	active: boolean;
}

export type ProductResult = { ok: true } | { ok: false; errors: Record<string, string> };

export async function requireProduct(crm: CrmScope, id: string): Promise<void> {
	const target = await crm.db
		.select({ id: product.id })
		.from(product)
		.where(owned(crm, product.ownerId, eq(product.id, id)))
		.get();
	if (!target) error(404, 'Product not found');
}

async function validateProduct(
	crm: CrmScope,
	input: ProductInput,
	id?: string
): Promise<ProductResult> {
	const errors: Record<string, string> = {};
	const dup = await crm.db
		.select({ id: product.id })
		.from(product)
		.where(owned(crm, product.ownerId, sql`lower(${product.name}) = lower(${input.name})`))
		.all();
	if (dup.some((d) => d.id !== id)) errors.name = 'duplicate';
	if (id && !input.active) {
		const others = await crm.db
			.select({ id: product.id })
			.from(product)
			.where(owned(crm, product.ownerId, sql`${product.active} = 1 and ${product.id} != ${id}`))
			.limit(1)
			.all();
		if (others.length === 0) errors.active = 'last_active';
	}
	return Object.keys(errors).length ? { ok: false, errors } : { ok: true };
}

export async function createProduct(crm: CrmScope, input: ProductInput): Promise<ProductResult> {
	const res = await validateProduct(crm, input);
	if (!res.ok) return res;
	await crm.db.insert(product).values({ ...input, ownerId: crm.ownerId });
	return { ok: true };
}

export async function updateProduct(
	crm: CrmScope,
	id: string,
	input: ProductInput
): Promise<ProductResult> {
	await requireProduct(crm, id);
	const res = await validateProduct(crm, input, id);
	if (!res.ok) return res;
	const [updated] = await crm.db
		.update(product)
		.set(input)
		.where(owned(crm, product.ownerId, eq(product.id, id)))
		.returning({ id: product.id });
	if (!updated) error(404, 'Product not found');
	return { ok: true };
}
