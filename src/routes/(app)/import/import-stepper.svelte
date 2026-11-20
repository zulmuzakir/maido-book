<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let { step }: { step: 1 | 2 | 3 } = $props();

	const done = $derived(step === 3);

	const steps = [
		{ n: 1, label: () => m.import_step_file() },
		{ n: 2, label: () => m.import_step_review() },
		{ n: 3, label: () => m.import_step_import() }
	] as const;
</script>

<ol aria-label={m.import_steps_label()} class="flex items-center gap-3 text-ui">
	{#each steps as item, i (item.n)}
		<li class="flex items-center gap-2" aria-current={step === item.n ? 'step' : undefined}>
			<span
				class={cn(
					'grid size-[22px] place-items-center rounded-full border-[1.5px] text-[11px] leading-[14px] font-bold num',
					done
						? 'border-primary bg-primary text-primary-foreground'
						: step >= item.n
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-muted-foreground bg-card text-muted-foreground'
				)}
			>
				{#if done}
					<Check class="size-3" aria-hidden="true" />
				{:else}
					{item.n}
				{/if}
			</span>
			<span
				class={step === item.n && !done
					? 'font-semibold text-foreground'
					: 'font-medium text-muted-foreground'}
			>
				{item.label()}
			</span>
		</li>
		{#if i < steps.length - 1}
			<li aria-hidden="true" class="h-px w-5 bg-rule md:w-10"></li>
		{/if}
	{/each}
</ol>
