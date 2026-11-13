<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { online } from 'svelte/reactivity/window';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import SearchIcon from '@lucide/svelte/icons/search';
	import WifiOffIcon from '@lucide/svelte/icons/wifi-off';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';

	const notFound = $derived(page.status === 404);
	const offline = $derived(online.current === false);
	const Icon = $derived(notFound ? SearchIcon : offline ? WifiOffIcon : CircleAlertIcon);
	const title = $derived(
		notFound
			? m.error_page_not_found_title()
			: offline
				? m.error_page_offline_title()
				: m.error_page_title()
	);
	const description = $derived(
		notFound
			? m.error_page_not_found_body()
			: offline
				? m.error_page_offline()
				: m.error_page_body()
	);

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await invalidateAll();
		} catch {
			// A failed retry keeps the current view; the user can try again.
		} finally {
			retrying = false;
		}
	}
</script>

<svelte:head>
	<title>{title} · {m.app_name()}</title>
</svelte:head>

<div class="flex flex-1 flex-col items-center justify-center gap-4 bg-card p-10 text-center">
	<span
		class="grid size-14 place-items-center rounded-full bg-alert text-status-overdue"
		aria-hidden="true"
	>
		<Icon class="size-6" />
	</span>
	<div class="flex max-w-[420px] flex-col items-center gap-1.5">
		<h2 class="text-xl leading-6 font-bold tracking-[-0.02em]">{title}</h2>
		<p class="text-sm leading-[21px] text-muted-foreground">{description}</p>
	</div>
	<div class="flex flex-wrap items-center justify-center gap-2">
		{#if notFound}
			<Button href={resolve('/(app)')} class="h-11 px-3.5 text-ui font-semibold md:h-10 desk:h-10"
				>{m.error_page_home()}</Button
			>
		{:else}
			<Button
				onclick={retry}
				disabled={retrying}
				class="h-11 px-3.5 text-ui font-semibold md:h-10 desk:h-10">{m.error_page_retry()}</Button
			>
			{#if !offline}
				<Button
					href={resolve('/(app)')}
					variant="outline"
					class="h-11 px-3.5 text-ui font-semibold md:h-10 desk:h-10">{m.error_page_home()}</Button
				>
			{/if}
		{/if}
	</div>
</div>
