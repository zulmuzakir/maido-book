<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import SupplyChart from '#lib/components/supply-chart.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { gapSummary, supplyGaps, supplySteps } from '#lib/domain/supply.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	let {
		customerId,
		dosePerDay,
		orders,
		today,
		class: className
	}: {
		customerId: string;
		dosePerDay: number;
		orders: PageData['orders'];
		today: string;
		class?: string;
	} = $props();

	const latest = $derived(orders[0] ?? null);
	const gapInfo = $derived(gapSummary(supplyGaps(supplySteps(orders), today)));
	const locale = getLocale() === 'id' ? 'id' : 'en';
</script>

<section class={cn(latest ? 'space-y-5' : 'space-y-3', className)}>
	<div class="space-y-1">
		<h2 class="text-[17px] leading-[22px] font-bold">{m.customer_supply_title()}</h2>
		{#if latest}
			<p class="text-[13.5px] leading-5 text-muted-foreground">
				<span class="max-md:hidden">
					{m.customer_supply_hint({
						qty: latest.qty,
						unit: latest.unitLabel,
						product: latest.productName,
						date: formatDate(latest.orderDate, locale, 'short'),
						dose: dosePerDay
					})}
				</span>
				<span class="md:hidden">
					{m.customer_supply_hint_short({
						qty: latest.qty,
						unit: latest.unitLabel,
						product: latest.productName,
						date: formatDate(latest.orderDate, locale, 'short'),
						dose: dosePerDay
					})}
				</span>
			</p>
		{/if}
	</div>
	{#if latest}
		<div class="space-y-2">
			<SupplyChart {orders} {today} />
			{#if gapInfo.count > 0}
				<!-- Phone has no room for the hint's "Garis merah" sentence, so it reads the red line here. -->
				<p
					class="flex items-center gap-2 text-[13px] leading-[18px] text-muted-foreground md:hidden"
				>
					<span class="h-[3px] w-4 shrink-0 rounded-full bg-status-overdue" aria-hidden="true"
					></span>
					{gapInfo.averageDays !== null
						? m.customer_supply_gaps_avg({ count: gapInfo.count, days: gapInfo.averageDays })
						: m.customer_supply_gaps({ count: gapInfo.count })}
				</p>
			{/if}
		</div>
	{:else}
		<p class="text-sm text-muted-foreground">{m.customer_supply_none()}</p>
		<div>
			<Button variant="outline" href={resolve('/(app)/orders/new') + `?customer=${customerId}`}>
				{m.customer_supply_create()}
			</Button>
		</div>
	{/if}
</section>
