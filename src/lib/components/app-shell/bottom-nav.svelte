<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Plus from '@lucide/svelte/icons/plus';
	import Menu from '@lucide/svelte/icons/menu';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import { badgeCount, isActive, primaryNav, type NavItem } from './nav-items.js';

	let { queueCount }: { queueCount: number } = $props();

	const tabs = primaryNav.slice(0, 3);
	const moreActive = $derived(
		['/more', '/insights', '/import', '/settings'].some((h) => isActive(page.url.pathname, h))
	);

	const slotClass =
		'relative flex flex-col items-center gap-1 pt-0.5 text-[11px] leading-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';
</script>

{#snippet tab(item: NavItem)}
	{@const active = isActive(page.url.pathname, item.href)}
	<a
		href={resolve(item.route)}
		aria-current={active ? 'page' : undefined}
		class={cn(
			slotClass,
			active ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
		)}
	>
		<item.icon class="size-[22px]" aria-hidden="true" />
		<span>{item.label()}</span>
		{#if item.href === '/' && queueCount > 0}
			<span
				class="absolute top-0 left-1/2 ml-2 min-w-4 rounded-[4px] bg-primary px-1.5 py-px text-center text-xs leading-4 font-semibold text-primary-foreground num"
			>
				{badgeCount(queueCount)}
			</span>
		{/if}
	</a>
{/snippet}

<nav
	aria-label={m.nav_main_label()}
	class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-start border-t border-rule bg-card px-2 pt-2 pb-[max(1.625rem,env(safe-area-inset-bottom))] md:hidden"
>
	{@render tab(tabs[0])}
	{@render tab(tabs[1])}
	<a
		href={resolve('/(app)/orders/new')}
		aria-label={m.new_order()}
		class="mx-auto -mt-[18px] grid size-12 place-items-center rounded-[15px] bg-primary text-primary-foreground shadow-[0_6px_16px_color-mix(in_oklch,var(--primary)_30%,transparent)] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
	>
		<Plus class="size-[22px]" aria-hidden="true" />
	</a>
	{@render tab(tabs[2])}
	<a
		href={resolve('/(app)/more')}
		aria-current={moreActive ? 'page' : undefined}
		class={cn(
			slotClass,
			moreActive ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'
		)}
	>
		<Menu class="size-[22px]" aria-hidden="true" />
		<span>{m.nav_more()}</span>
	</a>
</nav>
