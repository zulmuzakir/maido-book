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

	// Desktop/tablet: 44px tabs with a 2px purple underline. Phone: 38px round pills, filled when
	// active. `underline` keeps the tab style at every width.
	const tabClass = (on: boolean) => {
		if (underline) {
			return cn(
				'relative inline-flex h-11 shrink-0 items-center gap-1.5 text-sm whitespace-nowrap outline-none focus-visible:underline',
				on
					? 'font-semibold text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary'
					: 'font-medium text-muted-foreground hover:text-foreground'
			);
		}
		return cn(
			'relative inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-[13.5px] font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring md:h-11 md:rounded-none md:border-0 md:px-0 md:text-sm md:focus-visible:ring-0 md:focus-visible:underline',
			on
				? 'border-primary bg-primary text-primary-foreground md:bg-transparent md:text-foreground md:after:absolute md:after:inset-x-0 md:after:bottom-0 md:after:h-0.5 md:after:bg-primary'
				: 'border-border bg-card text-foreground md:bg-transparent md:font-medium md:text-muted-foreground md:hover:text-foreground'
		);
	};

	const countClass = (on: boolean) =>
		underline
			? cn('text-[12.5px] font-semibold num', on ? 'text-primary-text' : 'text-muted-foreground')
			: cn(
					'font-semibold num md:text-[12.5px]',
					on ? 'opacity-85 md:text-primary-text md:opacity-100' : 'text-muted-foreground'
				);

	let scroller = $state<HTMLDivElement>();

	// Keep the active chip in view when the row scrolls (phone chips, long tab rows).
	$effect(() => {
		void active;
		const el = scroller?.querySelector<HTMLElement>('[data-active]');
		if (!scroller || !el || scroller.scrollWidth <= scroller.clientWidth) return;
		const box = scroller.getBoundingClientRect();
		const r = el.getBoundingClientRect();
		if (r.left < box.left) scroller.scrollLeft += r.left - box.left - 16;
		else if (r.right > box.right) scroller.scrollLeft += r.right - box.right + 16;
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

{#snippet content(item: Item, on: boolean)}
	{item.label}{#if item.count !== undefined}<span class={countClass(on)}>{item.count}</span>{/if}
{/snippet}

<div role="group" aria-label={label} class="flex min-w-0 items-center md:gap-5">
	<div
		bind:this={scroller}
		class={cn(
			'flex min-w-0 [scrollbar-width:none] items-center overflow-x-auto',
			underline ? 'gap-[26px]' : 'gap-2 md:gap-[26px]'
		)}
	>
		{#each items as item (item.key)}
			{@const on = item.key === active}
			{#if item.href}
				<a
					href={item.href}
					class={tabClass(on)}
					aria-current={on ? 'page' : undefined}
					data-active={on || undefined}>{@render content(item, on)}</a
				>
			{:else}
				<button
					type="button"
					class={tabClass(on)}
					aria-pressed={on}
					data-active={on || undefined}
					onclick={() => onselect?.(item.key)}>{@render content(item, on)}</button
				>
			{/if}
		{/each}
	</div>
</div>
