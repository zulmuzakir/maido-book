<script lang="ts">
	import { cn } from '#lib/utils.js';

	type Item = { key: string; label: string; count?: number; href?: string };

	let {
		items,
		active,
		onselect,
		label,
		underline = false
	}: {
		items: Item[];
		active: string;
		onselect?: (key: string) => void;
		label: string;
		underline?: boolean;
	} = $props();

	const tabClass = (on: boolean) => {
		if (underline) {
			return cn(
				'relative inline-flex h-[38px] shrink-0 items-center py-2.5 text-ui whitespace-nowrap outline-none focus-visible:underline md:h-11 md:py-3',
				on
					? 'font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
					: 'font-medium text-muted-foreground hover:text-foreground'
			);
		}
		return cn(
			'relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-ui whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-11 md:rounded-none md:px-0 md:py-3 md:focus-visible:ring-0 md:focus-visible:underline',
			on
				? 'bg-primary font-semibold text-primary-foreground md:bg-transparent md:text-foreground md:after:absolute md:after:inset-x-0 md:after:bottom-0 md:after:h-0.5 md:after:bg-primary'
				: 'border border-input font-medium text-foreground md:border-0 md:text-muted-foreground md:hover:text-foreground'
		);
	};
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

{#snippet content(item: Item, on: boolean)}
	{item.label}{#if item.count !== undefined}<span
			class={cn('font-medium num', on && 'opacity-80 md:text-muted-foreground md:opacity-100')}
			>{item.count}</span
		>{/if}
{/snippet}

<div role="group" aria-label={label} class="flex min-w-0 items-center md:gap-5">
	<div
		class={cn(
			'flex min-w-0 [scrollbar-width:none] items-center overflow-x-auto',
			underline ? 'gap-6' : 'gap-2 md:gap-5'
		)}
	>
		{#each items as item (item.key)}
			{@const on = item.key === active}
			{#if item.href}
				<a href={item.href} class={tabClass(on)} aria-current={on ? 'page' : undefined}
					>{@render content(item, on)}</a
				>
			{:else}
				<button
					type="button"
					class={tabClass(on)}
					aria-pressed={on}
					onclick={() => onselect?.(item.key)}>{@render content(item, on)}</button
				>
			{/if}
		{/each}
	</div>
</div>
