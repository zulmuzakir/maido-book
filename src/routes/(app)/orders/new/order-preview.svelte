<script lang="ts" module>
	export interface OrderPlan {
		days: number;
		dueIso: string;
		backdated: boolean;
		runsOut: string;
		due: string;
	}
</script>

<script lang="ts">
	import SupplyTrack from '#lib/components/supply-track.svelte';
	import { m } from '#lib/paraglide/messages.js';

	let {
		plan,
		orderDate,
		today,
		leadDays
	}: {
		plan: OrderPlan | null;
		orderDate: string;
		today: string;
		leadDays: number;
	} = $props();
</script>

<aside
	aria-labelledby="order-preview"
	class="space-y-4 rounded-lg border border-rule bg-card p-4 md:p-6"
>
	<h2 id="order-preview" class="text-ui font-semibold">{m.order_preview_title()}</h2>
	{#if plan}
		<p class="text-sm">
			{#if plan.backdated}
				{m.order_summary_backdated({ days: plan.days, runsOut: plan.runsOut })}
			{:else}
				{m.order_summary({ days: plan.days, runsOut: plan.runsOut, due: plan.due })}
			{/if}
		</p>
		<SupplyTrack
			size="lg"
			{orderDate}
			daysSupply={plan.days}
			{today}
			{leadDays}
			dueDate={plan.dueIso}
		/>
	{:else}
		<p class="text-sm text-muted-foreground">{m.order_preview_empty()}</p>
	{/if}
</aside>
