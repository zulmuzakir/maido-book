<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn } from '#lib/utils.js';

	let {
		id,
		label,
		count,
		expanded = true,
		ontoggle,
		icon,
		labelClass,
		class: className
	}: {
		id: string;
		label: string;
		count?: number;
		expanded?: boolean;
		ontoggle?: () => void;
		icon?: Snippet;
		labelClass?: string;
		class?: string;
	} = $props();

	const row = $derived(
		cn(
			'flex h-9 w-full items-center gap-2 border-b border-row-rule bg-subtle px-5 text-left',
			className
		)
	);
</script>

{#snippet content()}
	{#if icon}{@render icon()}{/if}
	<span class={cn('text-xs font-semibold text-avatar-foreground', labelClass)}>{label}</span>
	{#if count !== undefined}
		<span class="text-xs text-muted-foreground num">{count}</span>
	{/if}
	{#if ontoggle}
		<ChevronDownIcon
			class={cn(
				'ml-auto size-4 text-muted-foreground transition-transform',
				!expanded && '-rotate-90'
			)}
			aria-hidden="true"
		/>
	{/if}
{/snippet}

{#if ontoggle}
	<h2 {id}>
		<button type="button" class={row} aria-expanded={expanded} onclick={ontoggle}>
			{@render content()}
		</button>
	</h2>
{:else}
	<h2 {id} class={row}>
		{@render content()}
	</h2>
{/if}
