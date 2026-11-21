import { describe, expect, it } from 'vitest';
import { resolveSelection, type SelectionInput } from './queue-selection.ts';

const base: SelectionInput = {
	order: ['a', 'b', 'c'],
	present: new Set(['a', 'b', 'c']),
	selectedId: null,
	lastIndex: 0,
	dayDone: false,
	autoFirst: false
};

describe('resolveSelection', () => {
	it('keeps a pick that is still open', () => {
		expect(resolveSelection({ ...base, selectedId: 'b', lastIndex: 1 })).toBe('b');
	});

	it('keeps an open pick that the current tab or search hides', () => {
		expect(resolveSelection({ ...base, order: ['a'], selectedId: 'c', lastIndex: 2 })).toBe('c');
	});

	it('hands a closed pick over to the follow-up now in its slot', () => {
		const present = new Set(['a', 'c']);
		expect(
			resolveSelection({ ...base, order: ['a', 'c'], present, selectedId: 'b', lastIndex: 1 })
		).toBe('c');
	});

	it('falls back to the last row when the closed pick was the last one', () => {
		const present = new Set(['a', 'b']);
		expect(
			resolveSelection({ ...base, order: ['a', 'b'], present, selectedId: 'c', lastIndex: 2 })
		).toBe('b');
	});

	it('selects nobody once the day is done', () => {
		const present = new Set(['a']);
		expect(
			resolveSelection({ ...base, order: ['a'], present, selectedId: 'b', dayDone: true })
		).toBeNull();
	});

	it('selects nobody when the list is empty', () => {
		expect(
			resolveSelection({ ...base, order: [], present: new Set(), selectedId: 'b', lastIndex: 3 })
		).toBeNull();
	});

	it('opens the first follow-up only when allowed', () => {
		expect(resolveSelection({ ...base, autoFirst: true })).toBe('a');
		expect(resolveSelection(base)).toBeNull();
		expect(resolveSelection({ ...base, autoFirst: true, dayDone: true })).toBeNull();
		expect(resolveSelection({ ...base, order: [], autoFirst: true })).toBeNull();
	});
});
