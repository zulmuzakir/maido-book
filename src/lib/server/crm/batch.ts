import { Column, is, SQL, sql } from 'drizzle-orm';
import type { BatchItem } from 'drizzle-orm/batch';
import type { Db } from '#lib/server/db/index.ts';

export type Stmt = BatchItem<'sqlite'>;

/** Runs statements atomically (D1 batch); no-op for an empty list. */
export async function runBatch(db: Db, stmts: Stmt[]): Promise<void> {
	if (stmts.length === 0) return;
	await db.batch(stmts as [Stmt, ...Stmt[]]);
}

/** The `n` of a batched `count(*)` query's single row. */
export const countOf = (rows: { n: number }[]): number => rows[0]?.n ?? 0;

/**
 * Selected fields that survive `db.batch`. D1 batch results are objects keyed by column name, so in
 * a join two columns with the same name (`customer.id`, `follow_up.id`) collapse into one and
 * drizzle shifts every later value into the wrong field. Each column is aliased to its field key,
 * keeping its decoder (`timestamp_ms` → Date). Use it for every joined select that goes in a batch.
 */
export function batchSafe<T extends Record<string, unknown>>(fields: T): T {
	return Object.fromEntries(
		Object.entries(fields).map(([key, field]) => {
			if (is(field, Column)) return [key, sql`${field}`.mapWith(field).as(key)];
			if (is(field, SQL)) return [key, field.as(key)];
			return [key, field];
		})
	) as T;
}
