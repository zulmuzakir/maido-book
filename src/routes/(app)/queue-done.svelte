<script lang="ts">
	import CheckIcon from '@lucide/svelte/icons/check';
	import { formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let {
		variant,
		today,
		doneToday,
		waitingCount,
		next
	}: {
		/** `banner`: above the list. `panel`: the desktop side panel's day summary. */
		variant: 'banner' | 'panel';
		today: string;
		doneToday: number;
		waitingCount: number;
		next: PageData['upcoming'][number] | undefined;
	} = $props();

	const locale = $derived(getLocale());
	// Nothing was due and nothing was done: "all done" would not be true.
	const title = $derived(doneToday > 0 ? m.today_all_clear() : m.queue_nothing_due());
	const nextDue = $derived(next ? formatDate(next.dueDate, locale, 'short') : '');
</script>

{#if variant === 'banner'}
	<!-- Desktop shows the title only (the panel carries the numbers); tablet and phone add the next
	     customer and the day's numbers. -->
	<div
		class="flex flex-wrap items-center gap-x-3.5 gap-y-3 border-b border-rule bg-background px-4 py-[18px] md:flex-nowrap md:px-6 xl:px-8"
	>
		<span
			class="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
			aria-hidden="true"
		>
			<CheckIcon class="size-5" />
		</span>
		<div class="min-w-0 flex-1">
			<p class="text-[15.5px] leading-5 font-bold text-foreground">{title}</p>
			{#if next}
				<p class="mt-0.5 text-sm text-muted-foreground num lg:hidden">
					{m.today_next_up({ name: next.customer.name, due: nextDue })}
				</p>
			{/if}
		</div>
		{#if doneToday > 0 || waitingCount > 0}
			<p
				class="flex w-full items-baseline gap-x-1.5 text-sm text-muted-foreground num max-md:pl-[54px] md:w-auto lg:hidden"
			>
				<b class="text-2xl leading-none font-bold text-foreground">{doneToday}</b>
				{m.queue_done_stat_contacted()} ·
				<b class="text-2xl leading-none font-bold text-status-today">{waitingCount}</b>
				{m.queue_done_stat_waiting()}
			</p>
		{/if}
	</div>
{:else}
	<div class="flex flex-col gap-[22px] px-6 py-7">
		<div>
			<p class="text-ui font-semibold text-muted-foreground">{m.bucket_today()}</p>
			<p class="mt-0.5 text-lg leading-6 font-bold text-foreground num">
				{formatDate(today, locale, 'long')}
			</p>
		</div>
		<p class="flex items-baseline gap-2.5 border-b border-rule pb-[18px]">
			<span class="text-4xl leading-none font-bold tracking-[-0.03em] text-muted-foreground num"
				>{doneToday}</span
			>
			<span class="text-sm text-muted-foreground">{m.queue_done_contacted_rest()}</span>
		</p>
		<p class="flex items-baseline gap-2.5 border-b border-rule pb-[18px]">
			<span class="text-4xl leading-none font-bold tracking-[-0.03em] text-status-today num"
				>{waitingCount}</span
			>
			<span class="text-sm text-muted-foreground">{m.queue_done_waiting_rest()}</span>
		</p>
		{#if next}
			<div class="rounded-[8px] bg-background px-[18px] py-4 shadow-[inset_0_0_0_1px_var(--rule)]">
				<p class="text-ui font-semibold text-accent-foreground dark:text-primary-text">
					{m.queue_done_next_label()}
				</p>
				<p class="mt-1 text-base font-bold text-foreground num">
					{m.queue_done_next_value({ name: next.customer.name, due: nextDue })}
				</p>
			</div>
		{/if}
	</div>
{/if}
