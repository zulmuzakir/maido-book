<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import { formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let {
		sentToday,
		waitingCount,
		next
	}: {
		sentToday: number;
		waitingCount: number;
		next: PageData['upcoming'][number] | undefined;
	} = $props();

	const locale = $derived(getLocale());
</script>

<div class="flex flex-col items-start gap-3 border-b border-rule px-5 py-8">
	<span class="flex size-12 items-center justify-center rounded-full bg-success-tint">
		<CircleCheckIcon class="size-6 text-status-done" aria-hidden="true" />
	</span>
	<div class="space-y-1">
		<p class="text-lg font-bold tracking-[-0.02em] text-foreground">{m.today_all_clear()}</p>
		{#if sentToday > 0}
			<p class="text-sm text-muted-foreground num">
				{m.today_done_sent({ count: sentToday })}
			</p>
		{/if}
		{#if waitingCount > 0}
			<p class="text-sm text-muted-foreground num">
				{m.today_done_waiting({ count: waitingCount })}
			</p>
		{/if}
		{#if next}
			<p class="text-sm text-muted-foreground">
				{m.today_next_up({
					name: next.customer.name,
					due: formatDate(next.dueDate, locale, 'short')
				})}
			</p>
		{/if}
	</div>
</div>
