<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let {
		customer,
		latest,
		today,
		showNotes = true
	}: {
		customer: PageData['customer'];
		latest: PageData['orders'][number] | null;
		today: string;
		showNotes?: boolean;
	} = $props();

	const locale = getLocale() === 'id' ? 'id' : 'en';

	const newest = $derived(
		latest
			? supplyStatus({
					orderDate: latest.orderDate,
					daysSupply: latest.daysSupply,
					today
				})
			: null
	);
	const runsOutOn = $derived(newest ? newest.runsOutOn : null);
	const runsOutPast = $derived(runsOutOn !== null && runsOutOn < today);

	const dataRows = $derived([
		{ label: m.customer_data_product(), value: latest?.productName ?? '—', tone: '' },
		{
			label: m.customer_data_qty(),
			value: latest ? `${latest.qty} ${latest.unitLabel}` : '—',
			tone: ''
		},
		{ label: m.dose_per_day(), value: `${customer.dosePerDay}`, tone: '' },
		{
			label: m.customers_col_last_order(),
			value: latest ? formatDate(latest.orderDate, locale, 'medium') : '—',
			tone: ''
		},
		{
			label: m.customer_data_runs_out(),
			value: runsOutOn ? formatDate(runsOutOn, locale, 'medium') : '—',
			tone: runsOutPast ? 'text-status-overdue' : ''
		}
	]);
</script>

<div class="space-y-[22px]">
	<section>
		<h2 class="pb-2 text-[15px] leading-[18px] font-semibold md:pb-1 md:text-sm md:font-bold">
			{m.customer_data_title()}
		</h2>
		<dl>
			{#each dataRows as row (row.label)}
				<div
					class="flex h-10 items-center justify-between gap-3 border-b border-rule md:border-row-rule"
				>
					<dt class="text-ui text-muted-foreground">{row.label}</dt>
					<dd class="text-right text-ui font-semibold num {row.tone}">{row.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	{#if showNotes}
		<section class="space-y-2">
			<div class="flex items-center justify-between">
				<h2 class="text-[15px] leading-[18px] font-semibold md:text-sm md:font-bold">
					{m.customer_form_notes()}
				</h2>
				<a
					href={resolve('/(app)/customers/[id]/edit', { id: customer.id })}
					class="text-ui font-semibold text-primary-text">{m.edit()}</a
				>
			</div>
			{#if customer.notes}
				<div
					class="rounded-[8px] bg-note px-3.5 py-3 text-ui leading-5 break-words whitespace-pre-line text-note-foreground"
				>
					{customer.notes}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">—</p>
			{/if}
		</section>
	{/if}
</div>
