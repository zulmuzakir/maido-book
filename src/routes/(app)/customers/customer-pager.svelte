<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		page,
		pages,
		from,
		to,
		total,
		prevHref,
		nextHref
	}: {
		page: number;
		pages: number;
		from: number;
		to: number;
		total: number;
		/** `null` disables the previous button. */
		prevHref: string | null;
		/** `null` disables the next button. */
		nextHref: string | null;
	} = $props();

	const PAGER_BUTTON =
		'h-11 w-full rounded-lg px-3.5 text-sm font-medium md:h-9 md:w-auto md:text-ui md:font-semibold';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<nav
	class="mt-auto flex flex-col items-center gap-3 px-4 pt-4 text-ui md:h-[52px] md:flex-row md:justify-between md:border-t md:border-rule md:px-5 md:pt-0"
	aria-label={m.pagination_label()}
>
	<p class="text-center text-muted-foreground num md:text-left">
		{m.customers_range({ from, to, total })} · {m.customers_page_of({ page, pages })}
	</p>
	<div class="grid w-full grid-cols-2 gap-2 md:flex md:w-auto">
		{#if prevHref}
			<Button variant="outline" class={PAGER_BUTTON} href={prevHref} aria-label={m.previous()}>
				<ChevronLeftIcon class="size-4 md:hidden" aria-hidden="true" />
				{m.previous()}
			</Button>
		{:else}
			<Button
				variant="outline"
				class={cn(PAGER_BUTTON, 'disabled:text-disabled-foreground disabled:opacity-100')}
				disabled
			>
				<ChevronLeftIcon class="size-4 md:hidden" aria-hidden="true" />
				{m.previous()}
			</Button>
		{/if}
		{#if nextHref}
			<Button variant="outline" class={PAGER_BUTTON} href={nextHref} aria-label={m.next()}>
				{m.next()}
				<ChevronRightIcon class="size-4 md:hidden" aria-hidden="true" />
			</Button>
		{:else}
			<Button variant="outline" class={PAGER_BUTTON} disabled>
				{m.next()}
				<ChevronRightIcon class="size-4 md:hidden" aria-hidden="true" />
			</Button>
		{/if}
	</div>
</nav>
