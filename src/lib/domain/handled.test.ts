import { describe, expect, it } from 'vitest';
import { pickHandled, type HandledActivity } from './handled.ts';

const row = (
	customerId: string,
	type: HandledActivity['type'],
	outcome: HandledActivity['outcome'] = null
) => ({
	customerId,
	type,
	outcome
});

describe('pickHandled', () => {
	it('keeps one entry per customer in order of their latest activity', () => {
		const out = pickHandled([
			row('a', 'wa_sent'),
			row('b', 'outcome', 'replied'),
			row('a', 'wa_sent')
		]);
		expect(out.map((r) => [r.customerId, r.result])).toEqual([
			['a', 'contacted'],
			['b', 'replied']
		]);
	});

	it('prefers an outcome or order over a later send', () => {
		const out = pickHandled([row('a', 'wa_sent'), row('a', 'order')]);
		expect(out).toHaveLength(1);
		expect(out[0].result).toBe('ordered');
	});

	it('keeps the newest outcome when there are several', () => {
		const out = pickHandled([row('a', 'outcome', 'interested'), row('a', 'outcome', 'no_reply')]);
		expect(out[0].result).toBe('interested');
	});

	it('reads an outcome without a value as a reply', () => {
		expect(pickHandled([row('a', 'outcome')])[0].result).toBe('replied');
	});
});
