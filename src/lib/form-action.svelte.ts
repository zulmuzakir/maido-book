import type { ActionResult, SubmitFunction } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import { toast } from 'svelte-sonner';
import { m } from '#lib/paraglide/messages.js';

/** What `use:enhance` hands to the callback after the action responds. */
export interface AfterSubmitInput {
	formData: FormData;
	formElement: HTMLFormElement;
	action: URL;
	result: ActionResult;
	update: (options?: {
		reset?: boolean;
		refreshAll?: boolean;
		navigate?: boolean;
	}) => Promise<void>;
}

/**
 * Wraps `use:enhance` for one form: tracks `pending`, ignores repeat submits while a request is in
 * flight, and turns thrown action errors and network failures into a toast instead of SvelteKit's
 * error page, so the user keeps what they typed.
 *
 * `onResult` handles `success`, `failure` and `redirect`; without it the default `update()` runs.
 */
export class FormAction {
	pending = $state(false);
	#onResult?: (input: AfterSubmitInput) => void | Promise<void>;

	constructor(onResult?: (input: AfterSubmitInput) => void | Promise<void>) {
		this.#onResult = onResult;
	}

	enhance: SubmitFunction = ({ cancel }) => {
		if (this.pending) {
			cancel();
			return;
		}
		this.pending = true;
		return async (input) => {
			try {
				if (input.result.type === 'error') await reportActionError(input.result.status);
				else if (this.#onResult) await this.#onResult(input);
				else await input.update();
			} finally {
				this.pending = false;
			}
		};
	};
}

/**
 * No status means the request never got a response (offline, timeout). 404 means the record was
 * closed or deleted elsewhere, so the page reloads its data to drop the stale row.
 */
export async function reportActionError(status: number | undefined) {
	if (!status) {
		toast.error(m.action_error_network());
		return;
	}
	if (status === 404) {
		toast.error(m.action_error_gone());
		await invalidateAll();
		return;
	}
	toast.error(m.action_error_server());
}
