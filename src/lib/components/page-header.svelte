<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronLeft from '@lucide/svelte/icons/chevron-left';
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
		/** A parent page to step back to, shown above the title. */
		back?: { href: string; label: string; mobileLabel?: string };
		/** One quiet line under the title: a date, a count, a phone number. */
		meta?: Snippet;
		/** Search control, right-aligned before the actions. */
		search?: Snippet;
		/** Page-level actions, right-aligned. */
		actions?: Snippet;
		/** `centered`: below md, "‹ Back" on the left and a small centred title. */
		variant?: 'default' | 'centered';
		/** Sets `meta` on the title's line from this breakpoint up. Stacked below it. */
		metaInline?: 'md' | 'lg';
		/** Shows the title-block back link below md only; the centred row covers mobile. */
		backMobileOnly?: boolean;
		class?: string;
	} = $props();

	const centered = $derived(variant === 'centered' && back);
	// Form headers (back link above the title) match Paper's 22/28 title and 18/28 padding on desktop.
	const formHeader = $derived(!!back && !backMobileOnly);
	const titleRow = $derived(
		metaInline === 'md'
			? 'md:flex-row md:flex-wrap md:items-baseline md:gap-x-2.5'
			: metaInline === 'lg'
				? 'lg:flex-row lg:flex-wrap lg:items-baseline lg:gap-x-2'
				: ''
	);
	const metaPad = $derived(
		metaInline === 'md' ? 'md:pb-0' : metaInline === 'lg' ? 'md:pb-2 lg:pb-0' : 'md:pb-2'
	);
</script>

<!-- Callers pass an href already built with resolve(). -->
<!-- eslint-disable svelte/no-navigation-without-resolve -->
<header
	class={cn(
		'relative flex items-center gap-3 bg-card px-4 pt-2 pb-3 md:min-h-[60px] md:border-b md:border-rule md:px-5 md:py-0',
		formHeader && 'md:min-h-0 md:px-7 md:py-[18px]',
		centered && 'border-b border-rule pt-1',
		className
	)}
>
	{#if centered && back}
		<div class="grid w-full grid-cols-[1fr_auto_1fr] items-center md:hidden">
			<a
				href={back.href}
				class="-ml-1 inline-flex items-center gap-1.5 justify-self-start rounded-lg px-1 text-sm leading-[18px] font-medium text-ink"
			>
				<ChevronLeft class="size-4" aria-hidden="true" />
				{back.mobileLabel ?? back.label}
			</a>
			<h1 class="text-base leading-5 font-bold tracking-[-0.02em]">{title}</h1>
			<div class="flex items-center justify-end gap-2">
				{#if search}{@render search()}{/if}
				{#if actions}{@render actions()}{/if}
			</div>
		</div>
	{/if}
	<div
		class={cn(
			'min-w-0 flex-1 flex-col gap-0.5 md:flex',
			titleRow,
			formHeader && 'md:gap-2.5',
			centered ? 'hidden' : 'flex'
		)}
	>
		{#if back}
			<a
				href={back.href}
				class={cn(
					'-ml-1 inline-flex min-h-11 w-fit items-center gap-0.5 rounded-lg px-1 text-ui font-medium text-muted-foreground hover:text-foreground md:min-h-0',
					!formHeader && 'md:pt-2',
					backMobileOnly && 'md:hidden'
				)}
			>
				<ChevronLeft class="size-4" aria-hidden="true" />
				{back.label}
			</a>
		{/if}
		<h1
			class={cn(
				'text-[26px] leading-[1.1] font-bold tracking-[-0.03em] md:text-lg md:leading-[22px] md:tracking-[-0.02em]',
				formHeader && 'md:text-[22px] md:leading-7 md:tracking-[-0.03em]'
			)}
		>
			{title}
		</h1>
		{#if meta}
			<div class={cn('text-ui text-muted-foreground', metaPad)}>{@render meta()}</div>
		{/if}
	</div>
	<div class={cn('items-center gap-2 md:flex', centered ? 'hidden' : 'flex')}>
		{#if search}{@render search()}{/if}
		{#if actions}{@render actions()}{/if}
	</div>
</header>
