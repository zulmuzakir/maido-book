<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let { step, finished = false }: { step: 1 | 2 | 3; finished?: boolean } = $props();

	const steps = [
		{ n: 1, label: () => m.import_step_file() },
		{ n: 2, label: () => m.import_step_review() },
		{ n: 3, label: () => m.import_step_import() }
	] as const;

	const isDone = (n: number) => finished || n < step;
</script>

<!-- 28px discs joined by flexible lines. Done steps are filled with a check and the line after them
     turns primary. Phone labels only the current step. -->
<ol aria-label={m.import_steps_label()} class="flex items-center gap-2 text-sm">
	{#each steps as item, i (item.n)}
		{@const done = isDone(item.n)}
		{@const current = step === item.n && !finished}
		<li
			class={cn('flex items-center gap-2', i < steps.length - 1 && 'flex-1 md:max-w-[200px]')}
			aria-current={current ? 'step' : undefined}
		>
			<span
				class={cn(
					'grid size-7 shrink-0 place-items-center rounded-full border text-[13px] font-bold num',
					done || current
						? 'border-primary bg-primary text-primary-foreground'
						: 'border-border bg-card text-muted-foreground'
				)}
			>
				{#if done}
					<Check class="size-[15px] stroke-[2.6]" aria-hidden="true" />
				{:else}
					{item.n}
				{/if}
			</span>
			<span
				class={cn(
					'whitespace-nowrap',
					current ? 'font-bold text-foreground' : 'font-medium text-muted-foreground',
					!current && 'sr-only md:not-sr-only'
				)}
			>
				{item.label()}
			</span>
			{#if i < steps.length - 1}
				<span
					class={cn('h-0.5 min-w-4 flex-1 rounded-[1px]', done ? 'bg-primary' : 'bg-rule')}
					aria-hidden="true"
				></span>
			{/if}
		</li>
	{/each}
</ol>
