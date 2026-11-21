<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	let {
		icon: Icon,
		tone = 'neutral',
		size = 'md',
		title,
		description,
		actions,
		class: className
	}: {
		icon: Component<{ class?: string }>;
		/** `brand`: a first-run invitation (nothing here yet). `neutral`: nothing matches. */
		tone?: 'neutral' | 'brand' | 'error' | 'success';
		/** `sm`: the quieter version for side panels and inset cards (52px circle, 15px title). */
		size?: 'md' | 'sm';
		title: string;
		description?: string;
		actions?: Snippet;
		class?: string;
	} = $props();

	const circle = {
		neutral: 'bg-secondary text-muted-foreground',
		brand: 'bg-avatar text-primary-text',
		error: 'bg-alert text-status-overdue',
		success: 'bg-success-tint text-status-done'
	};
	const sizes = {
		md: {
			root: 'gap-2.5 py-10',
			circle: 'mb-2.5 size-[72px]',
			icon: 'size-[30px]',
			title: 'text-[21px] leading-[26px] font-bold tracking-[-0.015em]',
			description: 'max-w-[440px] text-[15px] leading-[23px]'
		},
		sm: {
			root: 'gap-1.5 py-8',
			circle: 'mb-2 size-[52px]',
			icon: 'size-[22px]',
			title: 'text-[15px] leading-5 font-semibold',
			description: 'max-w-[400px] text-sm leading-[21px]'
		}
	};
	const s = $derived(sizes[size]);
</script>

<!-- Phone: actions stack at full width (48px); md up they sit side by side. -->
<div class={cn('flex w-full flex-col items-center px-6 text-center', s.root, className)}>
	<span
		class={cn('grid place-items-center rounded-full', s.circle, circle[tone])}
		aria-hidden="true"
	>
		<Icon class={s.icon} />
	</span>
	<h2 class={s.title}>{title}</h2>
	{#if description}
		<p class={cn('text-balance text-muted-foreground', s.description)}>
			{description}
		</p>
	{/if}
	{#if actions}
		<div
			class="mt-3.5 flex w-full flex-col gap-2.5 *:h-12 *:w-full *:font-semibold md:w-auto md:flex-row md:justify-center md:*:h-11 md:*:w-auto"
		>
			{@render actions()}
		</div>
	{/if}
</div>
