import { eq, sql } from 'drizzle-orm';
import { QueryBuilder } from 'drizzle-orm/sqlite-core';
import { describe, expect, it } from 'vitest';
import { customer, followUp } from '#lib/server/db/schema.ts';
import { batchSafe, countOf } from './batch.ts';

const qb = new QueryBuilder();

describe('batchSafe', () => {
	const query = qb
		.select(
			batchSafe({
				id: followUp.id,
				contactedAt: followUp.contactedAt,
				cId: customer.id,
				n: sql<number>`count(*)`
			})
		)
		.from(followUp)
		.innerJoin(customer, eq(customer.id, followUp.customerId));

	it('gives every selected column its own name', () => {
		const { sql: text } = query.toSQL();
		expect(text).toContain('"follow_up"."id" as "id"');
		expect(text).toContain('"customer"."id" as "cId"');
		expect(text).toContain('as "n"');
	});

	it('keeps the column decoders (timestamp_ms → Date)', () => {
		const fields = batchSafe({ contactedAt: followUp.contactedAt });
		const aliased = fields.contactedAt as unknown as {
			sql: { decoder: { mapFromDriverValue(v: unknown): unknown } };
		};
		expect(aliased.sql.decoder.mapFromDriverValue(1_700_000_000_000)).toEqual(
			new Date(1_700_000_000_000)
		);
	});
});

describe('countOf', () => {
	it('reads the single count row, 0 when empty', () => {
		expect(countOf([{ n: 4 }])).toBe(4);
		expect(countOf([])).toBe(0);
	});
});
