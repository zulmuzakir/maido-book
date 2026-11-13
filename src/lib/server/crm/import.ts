import * as v from 'valibot';
import type { Db } from '#lib/server/db/index.ts';
import { activity, customer, customerOrder, followUp, product } from '#lib/server/db/schema.ts';
import { isIsoDate } from '#lib/domain/dates.ts';
import { normalizePhone } from '#lib/domain/phone.ts';
import { planImportedCustomer } from '#lib/domain/follow-up.ts';
import { IMPORT_LIMITS } from '#lib/domain/import-sheet.ts';
import { runBatch, type Stmt } from './batch.ts';
import { getRules, listProducts } from './settings.ts';

const nullableText = (max: number) => v.nullable(v.pipe(v.string(), v.maxLength(max)));
const nullableInt = (max: number) =>
	v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(max)));

export const importRowsSchema = v.pipe(
	v.array(
		v.object({
			name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(IMPORT_LIMITS.name)),
			phone: v.string(),
			productName: nullableText(IMPORT_LIMITS.productName),
			qty: nullableInt(IMPORT_LIMITS.qty),
			dosePerDay: nullableInt(IMPORT_LIMITS.dosePerDay),
			lastOrderDate: v.nullable(v.pipe(v.string(), v.check(isIsoDate))),
			lastAction: nullableText(IMPORT_LIMITS.lastAction),
			notes: nullableText(IMPORT_LIMITS.notes)
		})
	),
	v.maxLength(2000)
);
export type ImportRowInput = v.InferOutput<typeof importRowsSchema>[number];

export async function importCustomers(
	db: Db,
	rows: ImportRowInput[],
	userId: string,
	today: string
): Promise<{ imported: number; skippedExisting: number; skippedInvalid: number }> {
	const [rules, products, existing] = await Promise.all([
		getRules(db),
		listProducts(db),
		db.select({ phone: customer.phone }).from(customer)
	]);
	const taken = new Set(existing.map((e) => e.phone));
	const byName = new Map(products.map((p) => [p.name.trim().toLowerCase(), p.id]));
	const defaultProductId = products.find((p) => p.active)?.id ?? products[0]?.id;

	let skippedInvalid = 0;
	let skippedExisting = 0;
	const stmts: Stmt[] = [];
	let imported = 0;

	for (const row of rows) {
		const phone = normalizePhone(row.phone);
		if (!phone) {
			skippedInvalid++;
			continue;
		}
		if (taken.has(phone)) {
			skippedExisting++;
			continue;
		}
		taken.add(phone);

		const plan = planImportedCustomer({ ...row, servingsPerUnit: 1 }, today, rules);
		const customerId = crypto.randomUUID();
		stmts.push(
			db.insert(customer).values({
				id: customerId,
				name: row.name,
				phone,
				dosePerDay: row.dosePerDay ?? 1,
				status: plan.status,
				notes: row.notes
			})
		);
		if (plan.order) {
			const key = row.productName?.trim().toLowerCase() ?? '';
			let productId = key ? byName.get(key) : defaultProductId;
			if (!productId) {
				productId = crypto.randomUUID();
				byName.set(key, productId);
				stmts.push(
					db.insert(product).values({
						id: productId,
						name: row.productName!.trim(),
						unitLabel: 'sachet',
						servingsPerUnit: 1,
						price: 0
					})
				);
			}
			stmts.push(
				db.insert(customerOrder).values({
					customerId,
					productId,
					orderDate: plan.order.orderDate,
					qty: plan.order.qty,
					dosePerDay: plan.order.dosePerDay,
					daysSupply: plan.order.daysSupply,
					totalPaid: null,
					createdBy: userId
				})
			);
		}
		if (plan.followUp)
			stmts.push(
				db.insert(followUp).values({
					customerId,
					kind: plan.followUp.kind,
					dueDate: plan.followUp.dueDate,
					attempt: 1,
					contactedAt: plan.followUp.contacted ? new Date() : null
				})
			);
		stmts.push(
			db.insert(activity).values({
				customerId,
				type: 'import',
				body: `Excel: ${row.lastAction ?? '-'}`,
				userId
			})
		);
		imported++;
	}
	await runBatch(db, stmts);
	return { imported, skippedExisting, skippedInvalid };
}

export async function existingPhones(db: Db): Promise<string[]> {
	const rows = await db.select({ phone: customer.phone }).from(customer);
	return rows.map((r) => r.phone);
}
