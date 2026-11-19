<script lang="ts">
	import { page } from '$app/state';
	import BottomNav from '#lib/components/app-shell/bottom-nav.svelte';
	import SideNav from '#lib/components/app-shell/side-nav.svelte';
	import FlashToast from '#lib/components/flash-toast.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	const title = $derived((page.data as { title?: string }).title ?? m.app_name());
	// The order form has its own sticky save bar on phones; two bars would stack.
	const hideBottomNav = $derived(
		[
			'/(app)/orders/new',
			'/(app)/customers/new',
			'/(app)/customers/[id]/edit',
			'/(app)/import'
		].includes(page.route.id ?? '')
	);
</script>

<svelte:head>
	<title>{title} · {m.app_name()}</title>
</svelte:head>

<FlashToast />
<SideNav queueCount={data.queueCount} user={data.user} />
<main
	class={[
		'min-h-dvh md:pb-0 md:pl-[72px] xl:pl-[232px]',
		!hideBottomNav && 'pb-[calc(3.125rem+max(1.625rem,env(safe-area-inset-bottom)))]'
	]}
>
	{@render children()}
</main>

{#if !hideBottomNav}
	<BottomNav queueCount={data.queueCount} />
{/if}
