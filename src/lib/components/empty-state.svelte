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
		tone?: 'neutral' | 'error' | 'success';
		title: string;
		description?: string;
		actions?: Snippet;
		class?: string;
	} = $props();

	const circle = {
		neutral: 'bg-secondary text-primary-text',
		error: 'bg-alert text-status-overdue',
		success: 'bg-success-tint text-status-done'
	};
</script>

<div class={cn('flex flex-col items-center gap-4 p-10 text-center', className)}>
	<span class={cn('grid size-14 place-items-center rounded-full', circle[tone])} aria-hidden="true">
		<Icon class="size-[26px]" />
	</span>
	<div class="flex max-w-[420px] flex-col items-center gap-1.5">
		<h2 class="text-xl leading-6 font-bold tracking-[-0.02em]">{title}</h2>
		{#if description}
			<p class="text-sm leading-[21px] text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex flex-wrap items-center justify-center gap-2">{@render actions()}</div>
	{/if}
</div>
