<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import SupplyChart from '#lib/components/supply-chart.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	let {
		customerId,
		dosePerDay,
		orders,
		today,
		leadDays,
		dueDate,
		class: className
	}: {
		customerId: string;
		dosePerDay: number;
		orders: PageData['orders'];
		today: string;
		leadDays: number;
		dueDate: string | null;
		class?: string;
	} = $props();

	const latest = $derived(orders[0] ?? null);
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
