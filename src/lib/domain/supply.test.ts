import { describe, expect, it } from 'vitest';
import { supplySteps } from './supply.ts';

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
