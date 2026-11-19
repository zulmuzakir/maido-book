import { deserialize } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { m } from '#lib/paraglide/messages.js';

/** How long the "Urungkan" action stays on a saved outcome, snooze or send toast. */
export const UNDO_MS = 8000;

/**
 * Reverses a just-saved outcome, snooze or logged send, then reloads so the customer is back in the
 * queue. Resolves once the reload is done.
 */
export async function undoFollowUp(
	action: 'undoOutcome' | 'undoSnooze' | 'undoSent' | 'undoResend',
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

/**
 * Confirms a logged WhatsApp send and offers to take it back, for a mis-tap or a chat never sent.
 * The send usually happens with WhatsApp in front, so while this page is hidden the toast waits:
 * the undo window only starts counting once the agent is back.
 */
export function sentToast(
	name: string,
	undo: unknown,
	action: 'undoSent' | 'undoResend' = 'undoSent'
) {
	if (!undo || typeof undo !== 'object') return;
	const show = (duration: number) =>
		toast.success(m.queue_sent_marked({ name }), {
			duration,
			action: {
				label: m.undo(),
				onClick: () => undoFollowUp(action, undo as Record<string, unknown>)
			}
		});
	if (typeof document === 'undefined' || !document.hidden) {
		show(UNDO_MS);
		return;
	}
	const waiting = show(Number.POSITIVE_INFINITY);
	const onVisible = () => {
		if (document.hidden) return;
		document.removeEventListener('visibilitychange', onVisible);
		toast.dismiss(waiting);
		show(UNDO_MS);
	};
	document.addEventListener('visibilitychange', onVisible);
}
