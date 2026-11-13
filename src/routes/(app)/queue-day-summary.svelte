<script lang="ts">
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

<div class="flex flex-col gap-5 px-6 py-8">
	<p class="text-lg font-bold tracking-[-0.02em] text-foreground">{m.today_all_clear()}</p>
	<div class="space-y-1.5 text-sm text-muted-foreground">
		{#if sentToday > 0}
			<p class="num">{m.today_done_sent({ count: sentToday })}</p>
		{/if}
		{#if waitingCount > 0}
			<p class="num">{m.today_done_waiting({ count: waitingCount })}</p>
		{/if}
	</div>
	{#if next}
		<div class="flex flex-col gap-1 rounded-[8px] bg-subtle px-4 py-3.5">
			<p class="text-sm font-semibold text-foreground">
				{m.today_next_up({
					name: next.customer.name,
					due: formatDate(next.dueDate, locale, 'short')
				})}
			</p>
		</div>
	{/if}
</div>
