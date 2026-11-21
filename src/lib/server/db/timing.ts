/** Per-request D1 usage: round trips to the database and the time spent waiting on them. */
export interface DbStats {
	trips: number;
	ms: number;
}

export const newDbStats = (): DbStats => ({ trips: 0, ms: 0 });

const EXECUTE = new Set<PropertyKey>(['first', 'all', 'run', 'raw']);

type Fn = (...args: unknown[]) => unknown;

/**
 * Wraps a D1 binding so every round trip (a statement run, or a whole `batch()`) is counted in
 * `stats`. The wrapped statements are unwrapped again before they reach the real `batch()`.
 */
export function instrumentD1(d1: D1Database, stats: DbStats): D1Database {
	const originals = new WeakMap<object, D1PreparedStatement>();

	const timed = async <T>(run: () => Promise<T>): Promise<T> => {
		const started = performance.now();
		try {
			return await run();
		} finally {
			stats.trips++;
			stats.ms += performance.now() - started;
		}
	};

	const wrapStatement = (stmt: D1PreparedStatement): D1PreparedStatement => {
		const proxy = new Proxy(stmt, {
			get(target, prop) {
				const value: unknown = Reflect.get(target, prop, target);
				if (typeof value !== 'function') return value;
				const fn = value as Fn;
				if (prop === 'bind')
					return (...args: unknown[]) =>
						wrapStatement(fn.apply(target, args) as D1PreparedStatement);
				if (EXECUTE.has(prop))
					return (...args: unknown[]) => timed(() => fn.apply(target, args) as Promise<unknown>);
				return fn.bind(target);
			}
		});
		originals.set(proxy, stmt);
		return proxy;
	};

	return new Proxy(d1, {
		get(target, prop) {
			const value: unknown = Reflect.get(target, prop, target);
			if (typeof value !== 'function') return value;
			const fn = value as Fn;
			if (prop === 'prepare')
				return (query: string) => wrapStatement(fn.call(target, query) as D1PreparedStatement);
			if (prop === 'batch')
				return (stmts: D1PreparedStatement[]) =>
					timed(
						() =>
							fn.call(
								target,
								stmts.map((s) => originals.get(s) ?? s)
							) as Promise<unknown>
					);
			return fn.bind(target);
		}
	});
}

/** The `Server-Timing` header value: one entry per measured span, durations in ms. */
export function serverTiming(spans: { name: string; ms: number; desc?: string }[]): string {
	return spans
		.map((s) => {
			const desc = s.desc ? `;desc="${s.desc.replace(/["\\]/g, '')}"` : '';
			return `${s.name}${desc};dur=${s.ms.toFixed(1)}`;
		})
		.join(', ');
}
