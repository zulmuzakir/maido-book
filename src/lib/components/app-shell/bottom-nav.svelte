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
		'relative flex h-full flex-col items-center justify-center gap-[3px] text-[11px] leading-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset';
	const stateClass = (active: boolean) =>
		active ? 'font-bold text-primary-text' : 'font-medium text-sidebar-muted';
</script>

{#snippet tab(item: NavItem)}
	{@const active = isActive(page.url.pathname, item.href)}
	<a
		href={resolve(item.route)}
		aria-current={active ? 'page' : undefined}
		class={cn(slotClass, stateClass(active))}
	>
		<span class="relative">
			<item.icon class="size-[22px]" aria-hidden="true" />
			{#if item.href === '/' && queueCount > 0}
				<span
					class="absolute -top-1 left-1/2 ml-1.5 inline-flex h-4 min-w-[18px] items-center justify-center rounded-lg bg-sidebar-primary px-1 text-[10px] leading-none font-extrabold text-sidebar-primary-foreground num"
				>
					{badgeCount(queueCount)}
				</span>
			{/if}
		</span>
		<span>{item.label()}</span>
	</a>
{/snippet}

<!-- 72px bar plus the home-indicator inset; the centre "+" rises 24px above it. -->
<nav
	aria-label={m.nav_main_label()}
	class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sidebar-border bg-sidebar px-1.5 pb-[env(safe-area-inset-bottom)] md:hidden"
>
	<div class="contents *:h-[66px]">
		{@render tab(tabs[0])}
		{@render tab(tabs[1])}
		<div class="flex justify-center">
			<a
				href={resolve('/(app)/orders/new')}
				aria-label={m.new_order()}
				class="-mt-6 grid size-[52px] place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_6px_16px_color-mix(in_oklch,var(--sidebar-primary)_35%,transparent)] outline-none focus-visible:ring-3 focus-visible:ring-ring"
			>
				<Plus class="size-6" aria-hidden="true" />
			</a>
		</div>
		{@render tab(tabs[2])}
		<a
			href={resolve('/(app)/more')}
			aria-current={moreActive ? 'page' : undefined}
			class={cn(slotClass, stateClass(moreActive))}
		>
			<Menu class="size-[22px]" aria-hidden="true" />
			<span>{m.nav_more()}</span>
		</a>
	</div>
	<div class="col-span-5 h-1.5" aria-hidden="true"></div>
</nav>
