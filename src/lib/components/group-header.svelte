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
		tone,
		class: className
	}: {
		id: string;
		label: string;
		count?: number;
		expanded?: boolean;
		ontoggle?: () => void;
		icon?: Snippet;
		labelClass?: string;
		/** Colours the count by meaning: red for overdue, amber for due today, grey otherwise. */
		tone?: 'overdue' | 'today';
		class?: string;
	} = $props();

	const row = $derived(
		cn(
			'relative -mt-px flex w-full items-center gap-2 border-y border-rule bg-secondary px-4 text-left md:px-6 xl:px-8',
			ontoggle ? 'h-11 desk:h-9' : 'h-9',
			className
		)
	);
</script>

{#snippet content()}
	{#if icon}{@render icon()}{/if}
	<span class={cn('text-ui font-bold text-band-title', labelClass)}>{label}</span>
	{#if count !== undefined}
		<span
			class={cn(
				'text-ui font-semibold num',
				tone === 'overdue'
					? 'text-status-overdue'
					: tone === 'today'
						? 'text-status-today'
						: 'text-muted-foreground'
			)}>{count}</span
		>
	{/if}
	{#if ontoggle}
		<ChevronDownIcon
			class={cn(
				'ml-auto size-4 text-muted-foreground transition-transform duration-(--motion-fast) ease-motion',
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
