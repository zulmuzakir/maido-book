<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import BottomNav from '#lib/components/app-shell/bottom-nav.svelte';
	import SideNav from '#lib/components/app-shell/side-nav.svelte';
	import ErrorState from '#lib/components/error-state.svelte';
	import FlashToast from '#lib/components/flash-toast.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// D30: offline, a client navigation would fail to load its data and fall to the root error
	// page without the shell. Stop it and show the offline state here instead.
	let offlineTarget: URL | null = $state(null);

	beforeNavigate((nav) => {
		if (
			navigator.onLine ||
			!nav.to ||
			nav.type === 'leave' ||
			nav.to.url.origin !== location.origin
		)
			return;
		nav.cancel();
		offlineTarget = nav.to.url;
	});

	afterNavigate(() => (offlineTarget = null));

	// A full load, not goto(): the page's code may have been fetched (and failed) while offline,
	// and the browser keeps that failed module until the page reloads. Still offline: stay here.
	async function retryOffline() {
		if (navigator.onLine && offlineTarget) location.assign(offlineTarget.href);
	}

	// The one owner of the tab title: each page's load returns its `title`; pages do not set one.
	const title = $derived.by(() => {
		const pageTitle = (page.data as { title?: string }).title;
		return pageTitle ? `${pageTitle} · ${m.app_name()}` : m.app_name();
	});
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<FlashToast />
<SideNav queueCount={data.queueCount} user={data.user} />
<main
	class="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[84px] xl:pl-[232px]"
>
	{#if offlineTarget}
		<div class="flex min-h-[calc(100dvh-4.75rem)] flex-col bg-card md:min-h-dvh">
			<ErrorState onretry={retryOffline} />
		</div>
	{:else}
		{@render children()}
	{/if}
</main>

<BottomNav queueCount={data.queueCount} />
