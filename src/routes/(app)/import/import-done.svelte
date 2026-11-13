<script lang="ts">
	import { resolve } from '$app/paths';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Outcome } from './import-model.ts';

	let { outcome, onreset }: { outcome: Outcome; onreset: () => void } = $props();
</script>

<section class="space-y-[22px]">
	<div class="flex items-start gap-3.5 md:items-center md:gap-4">
		<span
			class="grid size-11 shrink-0 place-items-center rounded-full bg-success-tint text-status-done md:size-12"
		>
			<CircleCheck class="size-[22px] md:size-6" aria-hidden="true" />
		</span>
		<div class="min-w-0 space-y-1">
			<h2 class="text-[20px] leading-6 font-bold tracking-[-0.02em]">
				{m.import_result_title()}
			</h2>
			<p class="text-sm leading-[21px] text-muted-foreground md:leading-[18px]">
				{m.import_result_summary({
					imported: outcome.imported,
					existing: outcome.skippedExisting,
					invalid: outcome.skippedInvalid
				})}
			</p>
		</div>
	</div>
	<div class="flex flex-col gap-2 md:flex-row md:flex-wrap">
		<Button href={resolve('/(app)')} class="h-12 px-3.5 text-ui font-semibold md:h-10 desk:h-10"
			>{m.import_view_today()}</Button
		>
		<Button
			href={resolve('/(app)/customers')}
			variant="outline"
			class="h-12 px-3.5 text-ui font-semibold md:h-10 desk:h-10"
		>
			{m.import_view_customers()}
		</Button>
		<Button
			variant="outline"
			class="h-12 px-3.5 text-ui font-semibold md:h-10 desk:h-10"
			onclick={onreset}>{m.import_start_over()}</Button
		>
	</div>
</section>
