<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import SectionHeading from '#lib/components/section-heading.svelte';
	import SupplyChart from '#lib/components/supply-chart.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let {
		customerId,
		dosePerDay,
		orders,
		today,
		leadDays,
		dueDate
	}: {
		customerId: string;
		dosePerDay: number;
		orders: PageData['orders'];
		today: string;
		leadDays: number;
		dueDate: string | null;
	} = $props();

	const latest = $derived(orders[0] ?? null);
	const locale = getLocale() === 'id' ? 'id' : 'en';
</script>

<section
	class="md:col-span-2 md:row-start-1 xl:col-span-1 xl:col-start-1 xl:row-start-1 xl:px-7 xl:pt-6 {latest
		? 'space-y-6'
		: 'space-y-3'}"
>
	<div class="space-y-1">
		<SectionHeading
			title={m.customer_supply_title()}
			class="[&_h2]:text-[15px] [&_h2]:leading-[18px] md:[&_h2]:text-base md:[&_h2]:leading-5"
		/>
		{#if latest}
			<p class="text-xs text-muted-foreground md:text-ui">
				<span class="max-md:hidden">
					{m.customer_supply_hint({
						qty: latest.qty,
						unit: latest.unitLabel,
						product: latest.productName,
						date: formatDate(latest.orderDate, locale, 'medium'),
						dose: dosePerDay
					})}
				</span>
				<span class="md:hidden">
					{m.customer_supply_hint_short({
						qty: latest.qty,
						unit: latest.unitLabel,
						product: latest.productName,
						date: formatDate(latest.orderDate, locale, 'medium'),
						dose: dosePerDay
					})}
				</span>
			</p>
		{/if}
	</div>
	{#if latest}
		<SupplyChart {orders} {today} {leadDays} {dueDate} />
	{:else}
		<p class="text-sm text-muted-foreground">{m.customer_supply_none()}</p>
		<div>
			<Button variant="outline" href={resolve('/(app)/orders/new') + `?customer=${customerId}`}>
				{m.customer_supply_create()}
			</Button>
		</div>
	{/if}
</section>
