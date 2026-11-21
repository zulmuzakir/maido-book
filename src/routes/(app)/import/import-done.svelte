<script lang="ts">
	import { resolve } from '$app/paths';
	import Check from '@lucide/svelte/icons/check';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import type { Outcome } from './import-model.ts';

	let { outcome, onreset }: { outcome: Outcome; onreset: () => void } = $props();

	const figures = $derived([
		{ value: outcome.imported, label: m.import_result_added(), tone: 'text-foreground' },
		{
			value: outcome.skippedExisting,
			label: m.import_result_existing(),
			tone: 'text-muted-foreground'
		},
		{
			value: outcome.skippedInvalid,
			label: m.import_result_invalid(),
			tone: outcome.skippedInvalid ? 'text-status-overdue' : 'text-muted-foreground'
		}
	]);
	const BUTTON = 'h-12 px-[22px] text-sm font-semibold md:h-11 desk:h-11';
</script>

<section
	class="flex flex-col items-stretch gap-4 rounded-[14px] border border-rule bg-card p-5 md:items-start md:p-8"
>
	<span class="grid size-[52px] place-items-center rounded-full bg-background text-primary-text">
		<Check class="size-7 stroke-[2.2]" aria-hidden="true" />
	</span>
	<h2 class="text-[22px] leading-7 font-bold tracking-[-0.02em]">{m.import_result_title()}</h2>
	<dl class="flex flex-col gap-2 md:grid md:grid-cols-[repeat(3,auto)] md:gap-10">
		{#each figures as f (f.label)}
			<div class="flex items-baseline gap-2.5 md:flex-col">
				<dt class="text-sm text-muted-foreground">{f.label}</dt>
				<dd
					class={cn(
						'order-first w-[58px] text-[30px] leading-none font-bold tracking-[-0.03em] num md:w-auto',
						f.tone
					)}
				>
					{f.value}
				</dd>
			</div>
		{/each}
	</dl>
	<div class="mt-1.5 flex flex-col gap-2.5 md:flex-row">
		<Button href={resolve('/(app)')} class={BUTTON}>{m.import_view_today()}</Button>
		<Button href={resolve('/(app)/customers')} variant="outline" class={BUTTON}>
			{m.import_view_customers()}
		</Button>
		<Button variant="inline" class={BUTTON} onclick={onreset}>
			{m.import_start_over()}
		</Button>
	</div>
</section>
