<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	let {
		icon: Icon,
		tone = 'neutral',
		title,
		description,
		actions,
		class: className
	}: {
		icon: Component<{ class?: string }>;
		/** `brand`: a first-run invitation (nothing here yet). `neutral`: nothing matches. */
		tone?: 'neutral' | 'brand' | 'error' | 'success';
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
</script>

<!-- Phone: actions stack at full width (48px); md up they sit side by side. -->
<div class={cn('flex w-full flex-col items-center gap-2.5 px-6 py-10 text-center', className)}>
	<span
		class={cn('mb-2.5 grid size-[72px] place-items-center rounded-full', circle[tone])}
		aria-hidden="true"
	>
		<Icon class="size-[30px]" />
	</span>
	<h2 class="text-[21px] leading-[26px] font-bold tracking-[-0.015em]">{title}</h2>
	{#if description}
		<p class="max-w-[440px] text-[15px] leading-[23px] text-balance text-muted-foreground">
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
