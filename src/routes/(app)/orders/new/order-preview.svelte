<script lang="ts" module>
	export interface OrderPlan {
		days: number;
		/** Days of stock left from today (0 once a backdated order has already run out). */
		daysLeft: number;
		dueIso: string;
		runsOutIso: string;
		backdated: boolean;
		runsOut: string;
		due: string;
	}
</script>

<script lang="ts">
	import { diffDays, formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		plan,
		orderDate,
		dateOutOfRange = false,
		today,
		class: className
	}: {
		plan: OrderPlan | null;
		orderDate: string;
		/** The order date is past tomorrow: say so instead of asking for quantity and dose. */
		dateOutOfRange?: boolean;
		today: string;
		class?: string;
	} = $props();

	const locale = $derived(getLocale());
	// The bar runs from the order date to the run-out date; the amber end is the follow-up window.
	const span = $derived(plan ? Math.max(1, diffDays(orderDate, plan.runsOutIso)) : 1);
	const duePct = $derived(
		plan ? Math.min(100, Math.max(0, (diffDays(orderDate, plan.dueIso) / span) * 100)) : 0
	);
	const startLabel = $derived(
		orderDate === today
			? m.order_preview_today({ date: formatDate(today, locale, 'short') })
			: formatDate(orderDate, locale, 'short')
	);
</script>

<!-- Desktop: a sticky card beside the form. Tablet/phone: the same card under it. -->
<aside
	aria-labelledby="order-preview"
	class={cn(
		'flex flex-col gap-3 rounded-[12px] bg-background p-[22px] shadow-[inset_0_0_0_1px_var(--rule)]',
		className
	)}
>
	<h2 id="order-preview" class="text-[13px] leading-4 font-semibold">
		{m.order_preview_title()}
	</h2>
	{#if plan}
		<p class="flex items-baseline gap-2">
			<span class="text-[40px] leading-none font-bold tracking-[-0.03em] num">±{plan.daysLeft}</span
			>
			<span class="text-[15px] text-muted-foreground">{m.order_preview_days_left()}</span>
		</p>
		<p class="text-[14.5px] leading-[21px]">
			{#if plan.backdated}
				{m.order_summary_backdated({ days: plan.days, runsOut: plan.runsOut })}
			{:else}
				{m.order_summary({ days: plan.days, runsOut: plan.runsOut, due: plan.due })}
			{/if}
		</p>
		<div class="pt-2">
			<div class="relative h-[18px]">
				<span
					class={cn(
						'absolute bottom-1 text-[12.5px] leading-4 font-semibold whitespace-nowrap text-status-today num',
						duePct > 40 ? '-translate-x-[calc(100%-6px)]' : '-translate-x-1.5'
					)}
					style:left="{duePct}%"
					>{m.order_preview_due_marker({ date: plan.due })}{duePct > 40 ? ' ↓' : ''}</span
				>
			</div>
			<div class="flex h-2.5 overflow-hidden rounded-full bg-track" aria-hidden="true">
				<div class="h-full bg-band-ok" style:width="{duePct}%"></div>
				<div class="h-full flex-1 bg-band-soon"></div>
			</div>
			<div class="mt-1.5 flex justify-between text-[12.5px] leading-4 text-muted-foreground num">
				<span>{startLabel}</span>
				<span>{m.order_preview_runs_out({ date: plan.runsOut })}</span>
			</div>
		</div>
		<ul class="flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
			<li class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-[2px] bg-band-ok" aria-hidden="true"></span>
				{m.track_legend_ok()}
			</li>
			<li class="flex items-center gap-1.5">
				<span class="size-2.5 rounded-[2px] bg-band-soon" aria-hidden="true"></span>
				{m.order_preview_legend_due()}
			</li>
		</ul>
	{:else}
		<div class="mt-1 h-2.5 rounded-full bg-track" aria-hidden="true"></div>
		<p class="text-sm leading-[21px] text-muted-foreground">
			{dateOutOfRange ? m.order_preview_date_out() : m.order_preview_empty()}
		</p>
	{/if}
</aside>
