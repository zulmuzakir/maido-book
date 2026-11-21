import { describe, expect, it } from 'vitest';
import { instrumentD1, newDbStats, serverTiming } from './timing.ts';

/** A stand-in D1 binding that records what reached it. */
function fakeD1() {
	const batched: unknown[][] = [];
	const created = new Set<object>();
	class Stmt {
		constructor(
			readonly query: string,
			readonly params: unknown[] = []
		) {
			created.add(this);
		}
		bind(...params: unknown[]) {
			return new Stmt(this.query, params);
		}
		async first() {
			return { query: this.query, params: this.params };
		}
		async all() {
			return { results: [] };
		}
		async run() {
			return { success: true };
		}
		async raw() {
			return [];
		}
	}
	const d1 = {
		prepare: (query: string) => new Stmt(query),
		batch: async (stmts: unknown[]) => {
			batched.push(stmts);
			return stmts.map(() => ({ results: [] }));
		},
		dump: async () => new ArrayBuffer(0)
	};
	return { d1: d1 as unknown as D1Database, batched, created };
}

describe('instrumentD1', () => {
	it('counts each statement run as one trip', async () => {
		const { d1 } = fakeD1();
		const stats = newDbStats();
		const db = instrumentD1(d1, stats);
		const stmt = db.prepare('select ?').bind(1);
		await stmt.all();
		await stmt.first();
		await stmt.run();
		await stmt.raw();
		expect(stats.trips).toBe(4);
		expect(stats.ms).toBeGreaterThanOrEqual(0);
	});

	it('keeps bound parameters and results intact', async () => {
		const { d1 } = fakeD1();
		const db = instrumentD1(d1, newDbStats());
		expect(await db.prepare('select ?').bind(7).first()).toEqual({
			query: 'select ?',
			params: [7]
		});
	});

	it('does not count preparing or binding', () => {
		const { d1 } = fakeD1();
		const stats = newDbStats();
		instrumentD1(d1, stats).prepare('select 1').bind();
		expect(stats.trips).toBe(0);
	});

	it('counts a batch as one trip and passes the real statements through', async () => {
		const { d1, batched, created } = fakeD1();
		const stats = newDbStats();
		const db = instrumentD1(d1, stats);
		await db.batch([db.prepare('a'), db.prepare('b').bind(2)]);
		expect(stats.trips).toBe(1);
		// The real binding sees its own statement objects, never the counting proxies.
		expect(batched[0].every((s) => created.has(s as object))).toBe(true);
		expect(batched[0].map((s) => (s as { query: string }).query)).toEqual(['a', 'b']);
	});

	it('leaves other methods alone', async () => {
		const { d1 } = fakeD1();
		const stats = newDbStats();
		await instrumentD1(d1, stats).dump();
		expect(stats.trips).toBe(0);
	});
});

describe('serverTiming', () => {
	it('formats spans with optional descriptions', () => {
		expect(
			serverTiming([
				{ name: 'db', ms: 12.345, desc: '3 trips' },
				{ name: 'total', ms: 20 }
			])
		).toBe('db;desc="3 trips";dur=12.3, total;dur=20.0');
	});
});
