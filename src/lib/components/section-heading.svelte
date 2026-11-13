<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	let {
		title,
		description,
		mobileDescription,
		id,
		size = 'md',
		actions,
		class: className
	}: {
		title: string;
		description?: string;
		/** Shown below `md` instead of `description` when the phone copy is shorter. */
		mobileDescription?: string;
		id?: string;
		size?: 'md' | 'sm';
		actions?: Snippet;
		class?: string;
	} = $props();
</script>

<div class={cn('flex items-start justify-between gap-3', className)}>
	<div class={cn('min-w-0', size === 'sm' && 'space-y-[3px]')}>
		<h2
			{id}
			class={size === 'sm'
				? 'text-[15px] leading-[18px] font-bold tracking-[-0.02em]'
				: 'text-base font-bold tracking-[-0.02em]'}
		>
			{title}
		</h2>
		{#if description}
			<p class={cn('text-ui text-muted-foreground', mobileDescription && 'hidden md:block')}>
				{description}
			</p>
		{/if}
		{#if mobileDescription}
			<p class="text-ui text-muted-foreground md:hidden">{mobileDescription}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 items-center gap-2">{@render actions()}</div>
	{/if}
</div>
