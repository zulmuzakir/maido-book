<script lang="ts">
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';

	let {
		page,
		pages,
		from,
		to,
		total,
		summary,
		prevHref,
		nextHref,
		moreHref,
		moreCount
	}: {
		page: number;
		pages: number;
		from: number;
		to: number;
		total: number;
		/** Shown instead of the pager when every result fits on one page. */
		summary: string;
		/** `null` disables the previous button. */
		prevHref: string | null;
		/** `null` disables the next button. */
		nextHref: string | null;
		/** Phone: the same list with the next rows appended, or `null` when all are shown. */
		moreHref: string | null;
		moreCount: number;
	} = $props();

	const PAGER_BUTTON = 'h-11 px-3.5 font-semibold desk:h-11';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<!-- Phone: one list that grows by 30 rows a tap, then says it is complete. -->
<div class="px-4 py-4 md:hidden">
	{#if moreHref}
		<Button
			variant="outline"
			href={moreHref}
			data-sveltekit-reset={false}
			data-sveltekit-replacestate
			class="h-12 w-full font-semibold"
		>
			{m.customers_load_more({ count: moreCount })}
		</Button>
	{:else}
		<p class="text-center text-[13px] text-muted-foreground">{m.customers_all_shown()}</p>
	{/if}
</div>

<!-- Tablet/desktop: pinned to the bottom of the viewport while the list scrolls above it. -->
<div
	class="sticky bottom-0 z-20 mt-auto hidden h-16 items-center justify-between gap-4 border-t border-rule bg-card px-6 text-[13.5px] text-muted-foreground md:flex xl:px-8"
>
	{#if pages <= 1}
		<p class="num">{summary}</p>
	{:else}
		<p class="num">
			{m.customers_range({ from, to, total })} · {m.customers_page_of({ page, pages })}
		</p>
		<nav class="flex gap-2" aria-label={m.pagination_label()}>
			{#if prevHref}
				<Button variant="outline" class={PAGER_BUTTON} href={prevHref}>
					<ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
					{m.previous()}
				</Button>
			{:else}
				<Button variant="outline" class={PAGER_BUTTON} disabled>
					<ChevronLeftIcon data-icon="inline-start" aria-hidden="true" />
					{m.previous()}
				</Button>
			{/if}
			{#if nextHref}
				<Button variant="outline" class={PAGER_BUTTON} href={nextHref}>
					{m.next()}
				</Button>
			{:else}
				<Button variant="outline" class={PAGER_BUTTON} disabled>
					{m.next()}
				</Button>
			{/if}
		</nav>
	{/if}
</div>
