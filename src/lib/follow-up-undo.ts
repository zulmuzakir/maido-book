import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { m } from '#lib/paraglide/messages.js';

/** How long the "Urungkan" action stays on a saved outcome or snooze toast. */
export const UNDO_MS = 8000;

/** Reverses a just-saved outcome or snooze, then reloads so the customer is back in the queue. */
export async function undoFollowUp(
	action: 'undoOutcome' | 'undoSnooze',
	fields: Record<string, unknown>
) {
	const body = new FormData();
	for (const [k, v] of Object.entries(fields)) if (v != null) body.set(k, String(v));
	try {
		const res = await fetch(`?/${action}`, {
			method: 'POST',
			body,
			headers: { 'x-sveltekit-action': 'true' }
		});
		const result = deserialize(await res.text());
		if (result.type === 'success') toast.success(m.today_undone());
		else toast.error(m.today_undo_failed());
	} catch {
		toast.error(m.action_error_network());
	}
	await invalidateAll();
}
