<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		title,
		back,
		meta,
		search,
		actions,
		variant = 'default',
		metaInline,
		backMobileOnly = false,
		class: className
	}: {
		title: string;
		/** A parent page to step back to. */
		back?: { href: string; label: string; mobileLabel?: string };
		/** One quiet line beside or under the title: a date, a count, a phone number. */
		meta?: Snippet;
		/** Search control, right-aligned before the actions. */
		search?: Snippet;
		/** Page-level actions, right-aligned. */
		actions?: Snippet;
		/** `subpage`: below md, a bare ‹ button and a small 17px title instead of the big title. */
		variant?: 'default' | 'subpage';
		/** Sets `meta` on the title's line from this breakpoint up. Stacked below it. */
		metaInline?: 'md' | 'lg';
		/** Hides the back link from md up, where the sidebar already shows the way back. */
		backMobileOnly?: boolean;
		class?: string;
	} = $props();

	const subpage = $derived(variant === 'subpage' && !!back);
	const showBackLink = $derived(!!back && !(subpage && backMobileOnly));
	const titleRow = $derived(
		metaInline === 'md'
			? 'md:flex-row md:flex-wrap md:items-baseline md:gap-x-3'
			: metaInline === 'lg'
				? 'lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-x-3'
				: ''
	);
</script>

<!-- Phone: 56px bar, 22px title (or ‹ + 17px title on a sub-page).
     Tablet/desktop: 68px bar, 24px title, 24/32px gutters, hairline below. -->
<!-- Callers pass an href already built with resolve(). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<header
	class={cn(
		'relative flex min-h-14 items-center gap-1 bg-card pr-2 pl-4 md:min-h-[68px] md:gap-4 md:border-b md:border-rule md:px-6 md:py-3.5 xl:px-8',
		subpage && 'pl-1',
		className
	)}
>
	{#if subpage && back}
		<a
			href={back.href}
			aria-label={m.back_to({ page: back.label })}
			class="grid size-11 shrink-0 place-items-center rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
		>
			<ChevronLeft class="size-[22px]" aria-hidden="true" />
		</a>
		<h1 class="min-w-0 flex-1 truncate text-[17px] leading-[22px] font-bold md:hidden">
			{title}
		</h1>
	{/if}
	<div class={cn('min-w-0 flex-1 flex-col gap-1', subpage ? 'hidden md:flex' : 'flex')}>
		{#if showBackLink && back}
			<a
				href={back.href}
				class={cn(
					'-my-1 inline-flex min-h-11 w-fit items-center gap-1 rounded-sm text-[13.5px] leading-[18px] font-semibold text-primary-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 md:min-h-0 md:py-1',
					backMobileOnly && 'md:hidden'
				)}
			>
				<ChevronLeft class="size-4" aria-hidden="true" />
				{back.label}
			</a>
		{/if}
		<div class={cn('flex min-w-0 flex-col gap-px', titleRow)}>
			<h1 class="text-[22px] leading-7 font-bold tracking-[-0.02em] md:text-2xl md:leading-[30px]">
				{title}
			</h1>
			{#if meta}
				<div class="text-ui text-muted-foreground md:text-sm">{@render meta()}</div>
			{/if}
		</div>
	</div>
	<div class="flex shrink-0 items-center gap-1 md:gap-2.5">
		{#if search}{@render search()}{/if}
		{#if actions}{@render actions()}{/if}
	</div>
</header>
