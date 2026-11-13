<script lang="ts">
	import { afterNavigate, replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { toast } from 'svelte-sonner';
	import { m } from '#lib/paraglide/messages.js';

	const messages: Record<string, () => string> = {
		order_saved: () => m.toast_order_saved(),
		customer_saved: () => m.toast_customer_saved(),
		customer_deleted: () => m.toast_customer_deleted(),
		import_done: () => m.toast_import_done()
	};

	// Runs once per navigation (including the initial load); not reactive on purpose.
	afterNavigate(() => {
		const key = page.url.searchParams.get('toast');
		if (key !== null) show(key);
	});

	function show(key: string) {
		const msg = messages[key];
		if (msg) toast.success(msg());
		const url = new URL(page.url.href);
		url.searchParams.delete('toast');
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		replaceState(url, page.state);
	}
</script>
