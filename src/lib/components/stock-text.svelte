<script lang="ts">
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		lastOrder,
		today,
		leadDays,
		prefix = false,
		class: className
	}: {
		lastOrder: { orderDate: string; daysSupply: number } | null;
		today: string;
		leadDays: number;
		prefix?: boolean;
		class?: string;
	} = $props();

	const view = $derived.by(() => {
		if (!lastOrder) return null;
		const { daysLeft } = supplyStatus({ ...lastOrder, today });
		if (daysLeft < 0)
			return { text: m.stock_out_ago({ count: -daysLeft }), tone: 'text-status-overdue' };
		if (daysLeft === 0) return { text: m.stock_out_today(), tone: 'text-status-overdue' };
		return {
			text: m.stock_days_left({ count: daysLeft }),
			tone: daysLeft <= leadDays ? 'text-status-today' : 'text-status-done'
		};
	});
</script>

{#if view}
	<span class={cn(className)}>
		{#if prefix}
			<span class="font-normal text-muted-foreground">{m.customer_stock_label()}</span>
			&nbsp;
		{/if}<span class={cn('font-semibold', view.tone)}>{view.text}</span>
	</span>
{:else}
	<span class={cn('text-muted-foreground', className)}>{m.queue_no_order()}</span>
{/if}
