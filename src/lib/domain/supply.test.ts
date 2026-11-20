import { describe, expect, it } from 'vitest';
import { gapSummary, supplyGaps, supplySteps } from './supply.ts';

describe('supplySteps', () => {
	it('shows a gap when the next order arrives after stock ran out', () => {
		const steps = supplySteps([
			{ orderDate: '2026-09-19', daysSupply: 20 },
			{ orderDate: '2026-10-17', daysSupply: 20 }
		]);
		expect(steps[1].before).toBe(-8);
	});

	it('sets the level after a single order to its days of supply', () => {
		const [step] = supplySteps([{ orderDate: '2026-09-19', daysSupply: 20 }]);
		expect(step.after).toBe(20);
	});

	it('sorts orders passed unsorted, oldest first', () => {
		const steps = supplySteps([
			{ orderDate: '2026-10-17', daysSupply: 20 },
			{ orderDate: '2026-09-19', daysSupply: 20 }
		]);
		expect(steps.map((s) => s.iso)).toEqual(['2026-09-19', '2026-10-17']);
	});
});

describe('supplyGaps', () => {
	// The board's Ibu Ratna: 20-day orders on 22 Aug, 19 Sep and 17 Oct, seen on 9 Nov.
	const steps = supplySteps([
		{ orderDate: '2026-08-22', daysSupply: 20 },
		{ orderDate: '2026-09-19', daysSupply: 20 },
		{ orderDate: '2026-10-17', daysSupply: 20 }
	]);

	it('finds the gaps between orders and the one still open today', () => {
		const gaps = supplyGaps(steps, '2026-11-09');
		expect(gaps.map((g) => [g.days, g.ongoing])).toEqual([
			[8, false],
			[8, false],
			[3, true]
		]);
	});

	it('has no open gap while stock remains', () => {
		expect(supplyGaps(steps, '2026-11-01').some((g) => g.ongoing)).toBe(false);
	});

	it('counts every gap but averages only the closed ones', () => {
		expect(gapSummary(supplyGaps(steps, '2026-11-09'))).toEqual({ count: 3, averageDays: 8 });
		expect(gapSummary([])).toEqual({ count: 0, averageDays: null });
	});
});
