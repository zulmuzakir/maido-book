import type { BatchItem } from 'drizzle-orm/batch';
import type { Db } from '#lib/server/db/index.ts';

export type Stmt = BatchItem<'sqlite'>;

/** Runs statements atomically (D1 batch); no-op for an empty list. */
export async function runBatch(db: Db, stmts: Stmt[]): Promise<void> {
	if (stmts.length === 0) return;
	await db.batch(stmts as [Stmt, ...Stmt[]]);
}
