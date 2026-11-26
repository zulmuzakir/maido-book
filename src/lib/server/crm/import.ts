import * as v from 'valibot';
import { owned, type CrmScope } from './scope.ts';
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
	crm: CrmScope,
	rows: ImportRowInput[],
	today: string
): Promise<{ imported: number; skippedExisting: number; skippedInvalid: number }> {
	const { db, ownerId } = crm;
	const [rules, products, existing] = await Promise.all([
		getRules(crm),
		listProducts(crm),
		customerPhonesQuery(crm)
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
				ownerId,
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
						ownerId,
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
					ownerId,
					customerId,
					productId,
					orderDate: plan.order.orderDate,
					qty: plan.order.qty,
					dosePerDay: plan.order.dosePerDay,
					daysSupply: plan.order.daysSupply,
					totalPaid: null,
					createdBy: ownerId
				})
			);
		}
		if (plan.followUp)
			stmts.push(
				db.insert(followUp).values({
					ownerId,
					customerId,
					kind: plan.followUp.kind,
					dueDate: plan.followUp.dueDate,
					attempt: 1,
					contactedAt: plan.followUp.contacted ? new Date() : null
				})
			);
		stmts.push(
			db.insert(activity).values({
				ownerId,
				customerId,
				type: 'import',
				body: `Excel: ${row.lastAction ?? '-'}`,
				userId: ownerId
			})
		);
		imported++;
	}
	await runBatch(db, stmts);
	return { imported, skippedExisting, skippedInvalid };
}

export const customerPhonesQuery = (crm: CrmScope) =>
	crm.db.select({ phone: customer.phone }).from(customer).where(owned(crm, customer.ownerId));
