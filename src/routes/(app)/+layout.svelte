<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '#lib/components/app-shell/bottom-nav.svelte';
	import SideNav from '#lib/components/app-shell/side-nav.svelte';
	import FlashToast from '#lib/components/flash-toast.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const title = $derived((page.data as { title?: string }).title ?? m.app_name());
</script>

<svelte:head>
	<title>{title} · {m.app_name()}</title>
</svelte:head>

<FlashToast />
<SideNav queueCount={data.queueCount} user={data.user} />
<main
	class="min-h-dvh pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 md:pl-[84px] xl:pl-[232px]"
>
	{@render children()}
</main>

<BottomNav queueCount={data.queueCount} />
