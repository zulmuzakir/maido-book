<script lang="ts">
	import { resolve } from '$app/paths';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import StatusBadge from '#lib/components/status-badge.svelte';
	import StockText from '#lib/components/stock-text.svelte';
	import WaIconButton from '#lib/components/wa-icon-button.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { formatPhone, waLink } from '#lib/domain/phone.ts';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	type CustomerRow = PageData['items'][number];

	let { items, today, leadDays }: { items: PageData['items']; today: string; leadDays: number } =
		$props();

	// Columns: name, then (md) status, then (xl) last order and phone. Header and rows share this
	// template so the columns line up. Below md only the name shows, with the WhatsApp button.
	const ROW_GRID =
		'grid min-w-0 flex-1 grid-cols-1 items-center gap-4 md:grid-cols-[minmax(0,1fr)_90px] xl:grid-cols-[minmax(0,1fr)_170px_150px_90px]';

	const locale = $derived(getLocale());

	function orderText(item: CustomerRow) {
		const o = item.lastOrder;
		if (!o) return null;
		return m.customers_row_order({
			qty: o.qty,
			unit: o.unitLabel,
			date: formatDate(o.orderDate, locale, 'short')
		});
	}
</script>

<!-- Column labels, md and up. The phone row labels each value inline. -->
<div
	class="hidden h-9 items-center gap-4 border-b border-row-rule bg-subtle px-5 text-xs font-semibold text-muted-foreground md:flex"
	aria-hidden="true"
>
	<div class={ROW_GRID}>
		<span>{m.customers_col_name()}</span>
		<span class="hidden xl:block">{m.customers_col_last_order()}</span>
		<span class="hidden xl:block">{m.customers_col_phone()}</span>
		<span>{m.customers_col_status()}</span>
	</div>
	<span class="size-9 shrink-0"></span>
</div>

<ul class="divide-y divide-row-rule">
	{#each items as item (item.id)}
		<li
			class="flex min-h-16 items-center gap-3 px-4 transition-colors hover:bg-muted/70 md:min-h-[60px] md:gap-4 md:px-6 xl:px-8"
		>
			<a
				href={resolve('/(app)/customers/[id]', { id: item.id })}
				class={cn(
					ROW_GRID,
					'py-3 md:py-2.5',
					'rounded-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring'
				)}
			>
				<PersonSummary
					name={item.name}
					avatarSize={40}
					avatarMdSize={36}
					class="md:gap-4"
					nameClass="truncate text-[15px] font-semibold leading-[18px] md:text-sm md:leading-[18px]"
				>
					<StockText
						lastOrder={item.lastOrder}
						{today}
						{leadDays}
						prefix
						class="block truncate text-ui"
					/>
				</PersonSummary>

				<div class="hidden min-w-0 xl:block">
					{#if orderText(item)}
						<p class="truncate text-ui text-foreground num">{orderText(item)}</p>
					{:else}
						<p class="text-ui text-muted-foreground">—</p>
					{/if}
				</div>

				<p class="hidden truncate text-ui text-muted-foreground num xl:block">
					{formatPhone(item.phone)}
				</p>

				<div class="hidden justify-self-end md:block md:justify-self-start">
					<StatusBadge kind="customer" value={item.status} class="text-ui" />
				</div>
			</a>

			<WaIconButton href={waLink(item.phone)} label={m.send_wa()} class="size-9" />
		</li>
	{/each}
</ul>
