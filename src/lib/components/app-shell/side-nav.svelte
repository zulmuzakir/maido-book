<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { scale } from 'svelte/transition';
	import { cn } from '#lib/utils.js';
	import UserMenu from './user-menu.svelte';
	import { badgeCount, isActive, primaryNav, secondaryNav, type NavItem } from './nav-items.js';

	let { queueCount, user }: { queueCount: number; user: { name: string; email: string } } =
		$props();
</script>

<!-- Tablet (md): an 84px rail, label under the icon, active item as a 56×32 pill behind the icon.
     Desktop (xl): a 232px sidebar, icon and label in a row, active item as a tinted row. -->
{#snippet link(item: NavItem)}
	{@const active = isActive(page.url.pathname, item.href)}
	<a
		href={resolve(item.route)}
		aria-current={active ? 'page' : undefined}
		class={cn(
			'group relative flex w-full flex-col items-center gap-1 py-1.5 text-sidebar-muted outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-inset xl:h-11 xl:flex-row xl:gap-3 xl:rounded-lg xl:px-3 xl:py-0 xl:transition-colors xl:hover:bg-sidebar-accent/60',
			active && 'text-sidebar-accent-foreground xl:bg-sidebar-accent xl:hover:bg-sidebar-accent'
		)}
	>
		<span
			class={cn(
				'grid h-8 w-14 place-items-center rounded-2xl transition-colors duration-(--motion-fast) group-hover:bg-sidebar-accent/60 xl:contents',
				active && 'bg-sidebar-accent group-hover:bg-sidebar-accent'
			)}
		>
			<item.icon class="size-5 shrink-0 xl:size-[19px]" aria-hidden="true" />
		</span>
		<span
			class={cn(
				'text-[11.5px] leading-[14px] tracking-[0.01em] xl:flex-1 xl:text-sm xl:leading-[18px] xl:tracking-normal',
				active ? 'font-bold xl:font-semibold' : 'font-medium'
			)}>{item.label()}</span
		>
		{#if item.href === '/' && queueCount > 0}
			<!-- Keyed on the number: the badge pops when the queue count changes. -->
			{#key badgeCount(queueCount)}
				<span
					class="absolute top-0.5 left-12 inline-flex h-[18px] min-w-5 items-center justify-center rounded-[9px] bg-sidebar-primary px-[5px] text-[11px] font-extrabold text-sidebar-primary-foreground num xl:static xl:h-5 xl:min-w-6 xl:rounded-[10px] xl:px-[7px] xl:text-xs xl:font-bold"
					in:scale={{ start: 0.6, duration: motionMs(DURATION.base), easing: EASE }}
				>
					{badgeCount(queueCount)}
				</span>
			{/key}
		{/if}
	</a>
{/snippet}

<nav
	aria-label={m.nav_main_label()}
	class="fixed inset-y-0 left-0 z-30 hidden w-[84px] flex-col items-center gap-1.5 overflow-y-auto border-r border-sidebar-border bg-sidebar pt-[18px] pb-4 text-sidebar-foreground md:flex xl:w-[232px] xl:items-stretch xl:gap-0.5 xl:px-3.5 xl:pt-5 [@media(max-height:30rem)]:gap-0.5"
>
	<a
		href={resolve('/(app)')}
		class="mb-[18px] flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:mb-[22px] xl:h-9 xl:px-1.5"
	>
		<span
			class="grid size-9 shrink-0 place-items-center rounded-[9px] bg-sidebar-primary text-[17px] font-extrabold text-sidebar-primary-foreground xl:size-[30px] xl:rounded-[7px] xl:text-[15px]"
			aria-hidden="true">{m.app_name().slice(0, 1)}</span
		>
		<span
			class="text-base leading-5 font-bold tracking-[-0.02em] text-sidebar-foreground max-xl:sr-only"
			>{m.app_name()}</span
		>
	</a>

	{#each primaryNav as item (item.href)}{@render link(item)}{/each}

	<div class="mt-auto flex w-full flex-col items-center gap-1.5 xl:items-stretch xl:gap-0.5">
		{#each secondaryNav as item (item.href)}{@render link(item)}{/each}
		<div class="mt-2.5 xl:mt-2.5 xl:border-t xl:border-sidebar-border xl:pt-1.5">
			<UserMenu {user} />
		</div>
	</div>
</nav>
