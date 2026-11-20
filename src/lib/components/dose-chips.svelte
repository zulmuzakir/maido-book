<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { choiceChip } from '#lib/styles.ts';
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils.js';

	const OPTIONS = ['1', '2', '3', 'other'] as const;

	let {
		name,
		selected,
		onselect,
		extra
	}: {
		name: string;
		selected: string;
		onselect: (opt: (typeof OPTIONS)[number]) => void;
		/** A fifth cell after the chips (the "other" dose input). */
		extra?: Snippet;
	} = $props();
</script>

<div class={cn('grid gap-2', extra ? 'grid-cols-5' : 'grid-cols-4')}>
	{#each OPTIONS as opt (opt)}
		<label class={cn(choiceChip, 'cursor-pointer px-2', opt !== 'other' && 'num')}>
			<input
				type="radio"
				{name}
				value={opt}
				checked={selected === opt}
				onchange={() => onselect(opt)}
				class="sr-only"
			/>
			{opt === 'other' ? m.dose_other() : m.dose_option({ count: Number(opt) })}
		</label>
	{/each}
	{@render extra?.()}
</div>
