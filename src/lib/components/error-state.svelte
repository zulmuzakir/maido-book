<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { online } from 'svelte/reactivity/window';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import SearchIcon from '@lucide/svelte/icons/search';
	import WifiOffIcon from '@lucide/svelte/icons/wifi-off';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';

	const notFound = $derived(page.status === 404);
	const offline = $derived(online.current === false);
	const Icon = $derived(notFound ? SearchIcon : offline ? WifiOffIcon : TriangleAlertIcon);
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

	// The app shell passes its own retry when it caught an offline navigation (it repeats that
	// navigation); error pages reload the current one.
	let { onretry = invalidateAll }: { onretry?: () => Promise<unknown> } = $props();

	let retrying = $state(false);

	async function retry() {
		retrying = true;
		try {
			await onretry();
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

<!-- Centred a little above the middle; on phones the buttons stack at full width. -->
<div
	class="flex flex-1 flex-col items-center justify-center gap-4 px-[21px] pt-10 pb-[18vh] text-center md:px-10"
>
	<span
		class={[
			'grid size-[72px] place-items-center rounded-full',
			notFound ? 'bg-secondary text-muted-foreground' : 'bg-alert text-status-overdue'
		]}
		aria-hidden="true"
	>
		<Icon class="size-[30px]" />
	</span>
	<div class="flex max-w-[300px] flex-col items-center gap-1.5">
		<h2 class="text-[21px] leading-[26px] font-bold tracking-[-0.015em]">{title}</h2>
		<p class="text-[15px] leading-[22px] text-muted-foreground">{description}</p>
	</div>
	<div class="flex w-full flex-col items-stretch gap-2 md:w-auto md:flex-row md:items-center">
		{#if notFound}
			<Button
				href={resolve('/(app)')}
				class="h-11 w-full px-[18px] text-sm font-semibold md:h-10 md:w-auto desk:h-10"
				>{m.error_page_home()}</Button
			>
		{:else}
			<Button
				onclick={retry}
				disabled={retrying}
				class="h-11 w-full px-[18px] text-sm font-semibold md:h-10 md:w-auto desk:h-10"
				>{m.error_page_retry()}</Button
			>
			{#if !offline}
				<Button
					href={resolve('/(app)')}
					variant="outline"
					class="h-11 w-full px-[18px] text-sm font-semibold md:h-10 md:w-auto desk:h-10"
					>{m.error_page_home()}</Button
				>
			{/if}
		{/if}
	</div>
</div>
