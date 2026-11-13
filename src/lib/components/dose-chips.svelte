<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';
	import { choiceChip } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';

	const OPTIONS = ['1', '2', '3', 'other'] as const;

	let {
		name,
		selected,
		onselect,
		segmented = false
	}: {
		name: string;
		selected: string;
		onselect: (opt: (typeof OPTIONS)[number]) => void;
		segmented?: boolean;
	} = $props();
</script>

<div class={cn('grid grid-cols-4', segmented ? 'gap-0' : 'gap-2')}>
	{#each OPTIONS as opt (opt)}
		<label
			class={cn(
				choiceChip,
				'cursor-pointer',
				segmented ? 'has-[:checked]:border-selected-ring' : 'has-[:checked]:font-medium',
				opt !== 'other' && 'num',
				segmented &&
					'-ml-px rounded-none first:ml-0 first:rounded-l-lg last:rounded-r-lg has-[:checked]:z-10'
			)}
		>
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
