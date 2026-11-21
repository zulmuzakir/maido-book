<script lang="ts">
	import { resolve } from '$app/paths';
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	let {
		customer,
		latest,
		today,
		class: className
	}: {
		customer: PageData['customer'];
		latest: PageData['orders'][number] | null;
		today: string;
		class?: string;
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
			value: latest ? m.queue_row_qty({ qty: latest.qty, unit: latest.unitLabel }) : '—',
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

<!-- Tablet sets the two blocks side by side; phone and the desktop aside stack them. -->
<div class={cn('grid gap-7 md:grid-cols-2 md:gap-6 xl:grid-cols-1 xl:gap-7', className)}>
	<section>
		<h2 class="pb-1.5 text-[17px] leading-[22px] font-bold">{m.customer_data_title()}</h2>
		<dl>
			{#each dataRows as row (row.label)}
				<div class="flex h-[42px] items-center justify-between gap-3 border-b border-rule">
					<dt class="text-sm text-muted-foreground">{row.label}</dt>
					<dd class="text-right text-[14.5px] font-semibold num {row.tone}">{row.value}</dd>
				</div>
			{/each}
		</dl>
	</section>

	<section class="flex flex-col gap-2">
		<div class="flex items-center justify-between">
			<h2 class="text-[17px] leading-[22px] font-bold">{m.customer_form_notes()}</h2>
			<a
				href={resolve('/(app)/customers/[id]/edit', { id: customer.id })}
				class="rounded-sm text-[13.5px] font-semibold text-primary-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
				>{m.edit()}</a
			>
		</div>
		{#if customer.notes}
			<div
				class="rounded-[8px] bg-note px-3.5 py-3 text-sm leading-[21px] break-words whitespace-pre-line text-foreground"
			>
				{customer.notes}
			</div>
		{:else}
			<p class="text-sm text-muted-foreground">—</p>
		{/if}
	</section>
</div>
