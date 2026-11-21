import { error, fail, type Actions } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { m } from '#lib/paraglide/messages.js';
import { parseForm } from '#lib/server/crm/form.ts';
import { csFirstName } from '#lib/server/crm/follow-ups.ts';
import {
	createProduct,
	listProducts,
	productsQuery,
	rulesQuery,
	templatesQuery,
	toRules,
	toTemplates,
	updateProduct,
	updateRules,
	updateTemplates
} from '#lib/server/crm/settings.ts';
import { productSchema, rulesSchema, templatesSchema } from '#lib/server/crm/schemas.ts';

export const load: PageServerLoad = async ({ locals }) => {
	const db = locals.db;
	const [products, ruleRows, templateRows] = await db.batch([
		productsQuery(db),
		rulesQuery(db),
		templatesQuery(db)
	]);
	const rules = toRules(ruleRows);
	const templates = toTemplates(templateRows);
	const sample = products.find((p) => p.active) ?? products[0];
	return {
		title: m.nav_settings(),
		products,
		rules,
		templates,
		csName: csFirstName(locals.user!.name),
		productName: sample?.name ?? ''
	};
};

export const actions: Actions = {
	createProduct: async ({ request, locals }) => {
		const parsed = parseForm(await request.formData(), productSchema);
		if (!parsed.ok) return fail(400, { action: 'createProduct', errors: parsed.errors });
		// New products are always active; the create form has no Aktif field.
		const res = await createProduct(locals.db, { ...parsed.data, active: true });
		if (!res.ok) return fail(400, { action: 'createProduct', errors: res.errors });
		return { ok: true, action: 'createProduct' };
	},

	updateProduct: async ({ request, locals }) => {
		const formData = await request.formData();
		const productId = String(formData.get('productId') ?? '');
		const products = await listProducts(locals.db);
		if (!products.some((p) => p.id === productId)) error(404, 'Product not found');
		const parsed = parseForm(formData, productSchema);
		if (!parsed.ok) return fail(400, { action: 'updateProduct', productId, errors: parsed.errors });
		const res = await updateProduct(locals.db, productId, parsed.data);
		if (!res.ok) return fail(400, { action: 'updateProduct', productId, errors: res.errors });
		return { ok: true, action: 'updateProduct' };
	},

	rules: async ({ request, locals }) => {
		const parsed = parseForm(await request.formData(), rulesSchema);
		if (!parsed.ok) return fail(400, { action: 'rules', errors: parsed.errors });
		await updateRules(locals.db, parsed.data);
		return { ok: true, action: 'rules' };
	},

	templates: async ({ request, locals }) => {
		const parsed = parseForm(await request.formData(), templatesSchema);
		if (!parsed.ok) return fail(400, { action: 'templates', errors: parsed.errors });
		await updateTemplates(locals.db, parsed.data);
		return { ok: true, action: 'templates' };
	}
};
