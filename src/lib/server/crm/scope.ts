import { and, eq, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import { error } from '@sveltejs/kit';
import type { Db } from '#lib/server/db/index.ts';

export type CrmScope = Readonly<{ db: Db; ownerId: string }>;

export function requireCrm(locals: App.Locals): CrmScope {
	if (!locals.crm) error(401);
	return locals.crm;
}

export function owned(crm: CrmScope, owner: SQLiteColumn, ...conditions: (SQL | undefined)[]): SQL {
	const byOwner = eq(owner, crm.ownerId);
	return conditions.length ? and(byOwner, ...conditions)! : byOwner;
}
