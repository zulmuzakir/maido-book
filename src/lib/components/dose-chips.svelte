<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { choiceChip } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';

	const OPTIONS = ['1', '2', '3', 'other'] as const;

	let {
		name,
		selected,
		onselect
	}: {
		name: string;
		selected: string;
		onselect: (opt: (typeof OPTIONS)[number]) => void;
	} = $props();
</script>

<div class="grid grid-cols-4 gap-2">
	{#each OPTIONS as opt (opt)}
		<label class={cn(choiceChip, 'cursor-pointer', opt !== 'other' && 'num')}>
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
</div>
