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

/** The callback a `SubmitFunction` returns for a submit that goes ahead. */
type AfterSubmit = Exclude<Awaited<ReturnType<SubmitFunction>>, void>;

/**
 * Wraps `use:enhance` for one form: tracks `pending`, ignores repeat submits while a request is in
 * flight, and turns thrown action errors and network failures into a toast instead of SvelteKit's
 * error page, so the user keeps what they typed.
 *
 * `onResult` handles `success`, `failure` and `redirect`; without it the default `update()` runs.
 */
export class FormAction {
	pending = $state(false);
	/**
	 * The button that sent the pending submit: its `data-busy-key`, else its `value` (`''` for no
	 * button or no value). The key separates buttons that can share a value.
	 */
	submitter = $state<string | null>(null);
	/** The last submit never reached the server. Only set with `inlineNetworkError`. */
	networkFailed = $state(false);
	#onResult?: (input: AfterSubmitInput) => void | Promise<void>;
	#inlineNetworkError: boolean;

	/**
	 * `inlineNetworkError`: a long form shows its own "not saved" alert and retry button, so a
	 * network failure sets `networkFailed` instead of raising a toast.
	 */
	constructor(
		onResult?: (input: AfterSubmitInput) => void | Promise<void>,
		{ inlineNetworkError = false }: { inlineNetworkError?: boolean } = {}
	) {
		this.#onResult = onResult;
		this.#inlineNetworkError = inlineNetworkError;
	}

	/**
	 * Whether the pending submit came from the button with this `data-busy-key` or `value`, so a
	 * form with several submit buttons (snooze chips, "save" and "save and order") shows the
	 * spinner on the one that was pressed. A button without either matches `''`.
	 */
	pendingFor(value = ''): boolean {
		return this.pending && this.submitter === value;
	}

	#settle: (() => void) | null = null;

	/**
	 * `enhance` for an optimistic form: `onstart(settled)` runs as a submit goes out (not for a
	 * repeat submit that is ignored), so the page can show the result at once; `settled` resolves
	 * when the action is over, whatever the outcome (success, failure, error or a throw), so the
	 * page can drop its optimistic state and let the real data, or the old row, show.
	 */
	optimistic(onstart: (settled: Promise<void>) => void): SubmitFunction {
		return (input) => {
			const after = this.enhance(input) as AfterSubmit | undefined;
			if (!after) return;
			let done!: () => void;
			const settled = new Promise<void>((resolve) => (done = resolve));
			this.#settle = done;
			onstart(settled);
			return async (raw) => {
				try {
					await after(raw);
				} finally {
					done();
				}
			};
		};
	}

	/**
	 * Ends the optimistic phase of the last submit early: an undo pressed in the toast before the
	 * reload lands must let the restored row show.
	 */
	settle() {
		this.#settle?.();
	}

	enhance: SubmitFunction = ({ cancel, submitter }) => {
		if (this.pending) {
			cancel();
			return;
		}
		this.pending = true;
		const button = submitter as HTMLButtonElement | null;
		this.submitter = button?.dataset?.busyKey ?? button?.value ?? '';
		this.networkFailed = false;
		return async (raw) => {
			// An action on this page (`?/sent` from `/?item=x`) differs from the current URL only by its
			// query, which SvelteKit treats as another page and navigates to. Apply the result here
			// instead, so the page keeps its query (and its history entry).
			const samePage = raw.action.pathname === location.pathname;
			const input: typeof raw = samePage
				? { ...raw, update: (opts) => raw.update({ navigate: false, ...opts }) }
				: raw;
			try {
				if (input.result.type === 'error' && !input.result.status && this.#inlineNetworkError) {
					this.networkFailed = true;
				} else if (input.result.type === 'error') await reportActionError(input.result.status);
				else if (this.#onResult) await this.#onResult(input);
				else await input.update();
			} finally {
				this.pending = false;
				this.submitter = null;
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
