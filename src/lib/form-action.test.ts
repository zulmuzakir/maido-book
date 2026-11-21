import { describe, expect, it, vi } from 'vitest';
import type { ActionResult } from '$app/forms';

vi.mock('$app/navigation', () => ({ invalidateAll: vi.fn() }));
vi.mock('svelte-sonner', () => ({ toast: { error: vi.fn() } }));
// The node test environment has no `location`; the callback compares the action's path with it.
vi.stubGlobal('location', new URL('http://localhost/x'));

const { FormAction } = await import('./form-action.svelte.ts');

type EnhanceInput = Parameters<InstanceType<typeof FormAction>['enhance']>[0];

/** The parts of `use:enhance`'s input that `FormAction` reads. */
function submit(action: InstanceType<typeof FormAction>, submitter: HTMLElement | null) {
	const cancel = vi.fn();
	const after = action.enhance({ cancel, submitter } as unknown as EnhanceInput);
	return { cancel, after };
}

function respond(after: unknown) {
	const result: ActionResult = { type: 'success', status: 200, location: '/x' };
	return (after as (input: unknown) => Promise<void>)({
		action: new URL('http://localhost/x'),
		result,
		update: vi.fn(async () => {})
	});
}

describe('FormAction.pendingFor', () => {
	it('names the button that sent the submit until the action responds', async () => {
		const action = new FormAction(async () => {});
		expect(action.pendingFor('2026-11-23')).toBe(false);

		const { after } = submit(action, { value: '2026-11-23' } as HTMLButtonElement);
		expect(action.pending).toBe(true);
		expect(action.pendingFor('2026-11-23')).toBe(true);
		expect(action.pendingFor('2026-11-25')).toBe(false);
		expect(action.pendingFor()).toBe(false);

		await respond(after);
		expect(action.pending).toBe(false);
		expect(action.pendingFor('2026-11-23')).toBe(false);
	});

	it("matches '' when the submit had no button or the button has no value", () => {
		const bare = new FormAction();
		submit(bare, null);
		expect(bare.pendingFor()).toBe(true);

		const plain = new FormAction();
		submit(plain, { value: '' } as HTMLButtonElement);
		expect(plain.pendingFor()).toBe(true);
		expect(plain.pendingFor('order')).toBe(false);
	});

	it('prefers data-busy-key over the value', () => {
		const action = new FormAction();
		const custom = { value: '2026-11-23', dataset: { busyKey: 'custom' } };
		submit(action, custom as unknown as HTMLButtonElement);
		expect(action.pendingFor('custom')).toBe(true);
		expect(action.pendingFor('2026-11-23')).toBe(false);
	});

	it('ignores a second submit while one is pending and keeps the first button', () => {
		const action = new FormAction();
		submit(action, { value: 'order' } as HTMLButtonElement);
		const second = submit(action, { value: '' } as HTMLButtonElement);

		expect(second.cancel).toHaveBeenCalledOnce();
		expect(action.pendingFor('order')).toBe(true);
	});
});
