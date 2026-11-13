<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import UserMenu from './user-menu.svelte';
	import { badgeCount, isActive, primaryNav, secondaryNav, type NavItem } from './nav-items.js';

	let { queueCount, user }: { queueCount: number; user: { name: string; email: string } } =
		$props();
</script>

{#snippet link(item: NavItem)}
	{@const active = isActive(page.url.pathname, item.href)}
	<a
		href={resolve(item.route)}
		aria-current={active ? 'page' : undefined}
		aria-label={item.label()}
		class={cn(
			'relative mx-auto flex size-11 items-center justify-center gap-2.5 rounded-[8px] text-sm font-medium text-sidebar-foreground transition-colors outline-none hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:mx-0 xl:h-[38px] xl:w-full xl:justify-start xl:px-2.5',
			active && 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
		)}
	>
		<item.icon class="size-[19px] shrink-0 xl:size-[17px]" aria-hidden="true" />
		<span class="leading-[18px] max-xl:sr-only xl:flex-1">{item.label()}</span>
		{#if item.href === '/' && queueCount > 0}
			<span
				class="rounded-[4px] bg-primary px-1.5 py-px text-xs font-semibold text-primary-foreground num max-xl:hidden"
			>
				{badgeCount(queueCount)}
			</span>
		{/if}
	</a>
{/snippet}

<nav
	aria-label={m.nav_main_label()}
	class="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col gap-6 overflow-y-auto bg-sidebar px-3 pt-4 pb-3 text-sidebar-foreground md:flex xl:w-[232px] xl:px-3.5 [@media(max-height:30rem)]:gap-3"
>
	<a
		href={resolve('/(app)')}
		class="flex h-[30px] items-center justify-center gap-2.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring xl:h-9 xl:justify-start xl:px-1.5"
	>
		<span
			class="grid size-[30px] shrink-0 place-items-center rounded-lg bg-sidebar-primary text-ui font-extrabold text-sidebar-primary-foreground xl:size-7"
			aria-hidden="true">{m.app_name().slice(0, 1)}</span
		>
		<span class="text-[15px] leading-[18px] font-bold tracking-[-0.02em] text-white max-xl:sr-only"
			>{m.app_name()}</span
		>
	</a>

	<div class="flex flex-col gap-1.5 xl:gap-0.5">
		{#each primaryNav as item (item.href)}{@render link(item)}{/each}
	</div>

	<div class="mt-auto flex flex-col gap-1.5 xl:gap-6">
		<div class="flex flex-col gap-1.5 xl:gap-0.5">
			{#each secondaryNav as item (item.href)}{@render link(item)}{/each}
		</div>
		<div class="xl:border-t xl:border-sidebar-border xl:pt-2.5">
			<UserMenu {user} />
		</div>
	</div>
</nav>
