import { drizzle } from 'drizzle-orm/d1';
import { describe, expect, it } from 'vitest';
import * as schema from '#lib/server/db/schema.ts';
import { customerOptionQuery } from './customers.ts';

describe('customerOptionQuery', () => {
	it("correlates the last-order subquery with the customer, not the order's own id", () => {
		const db = drizzle({} as D1Database, { schema });
		const { sql } = customerOptionQuery(db, 'c1').toSQL();
		expect(sql).toContain('where o.customer_id = "customer"."id")');
	});
});
