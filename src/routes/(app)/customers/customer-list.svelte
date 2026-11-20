<script lang="ts">
	import { resolve } from '$app/paths';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import SupplyTrack from '#lib/components/supply-track.svelte';
	import WaIconButton from '#lib/components/wa-icon-button.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { formatPhone, waLink } from '#lib/domain/phone.ts';
	import { customerStatusLabel } from '#lib/labels.ts';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	type CustomerRow = PageData['items'][number];

	let { items, today, leadDays }: { items: PageData['items']; today: string; leadDays: number } =
		$props();

	// Desktop: avatar | name | stock | last order | phone | status | Kirim, one template for the
	// header row and every row. Tablet: avatar | name over "phone · order" | stock | Kirim.
	// Phone: avatar | name over the stock bar | icon-only send.
	const GRID =
		'grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-x-3 md:grid-cols-[44px_minmax(0,1fr)_168px_100px] md:gap-x-4 xl:grid-cols-[44px_minmax(0,1.3fr)_190px_150px_170px_100px_100px]';

	const locale = $derived(getLocale());

	const orderText = (o: NonNullable<CustomerRow['lastOrder']>) =>
		m.customers_row_order({
			qty: o.qty,
			unit: o.unitLabel,
			date: formatDate(o.orderDate, locale, 'short')
		});
	const orderShort = (o: NonNullable<CustomerRow['lastOrder']>) =>
		m.customers_row_order_short({
			qty: o.qty,
			unit: o.unitLabel,
			date: formatDate(o.orderDate, locale, 'short')
		});
</script>

{#snippet stock(item: CustomerRow)}
	{#if item.lastOrder}
		<SupplyTrack
			orderDate={item.lastOrder.orderDate}
			daysSupply={item.lastOrder.daysSupply}
			{today}
			{leadDays}
			class="gap-1.5 [&>span]:text-[13px]"
		/>
	{:else}
		<span class="text-[13px] text-muted-foreground">{m.customer_supply_none()}</span>
	{/if}
{/snippet}

<div
	class="{GRID} hidden h-9 border-b border-rule px-8 text-xs font-semibold text-muted-foreground xl:grid"
	aria-hidden="true"
>
	<span></span>
	<span>{m.customers_col_name()}</span>
	<span>{m.customers_col_stock()}</span>
	<span>{m.customers_col_last_order()}</span>
	<span>{m.customers_col_phone()}</span>
	<span>{m.customers_col_status()}</span>
	<span></span>
</div>

<ul>
	{#each items as item (item.id)}
		{@const inactive = item.status !== 'active'}
		<li
			class="{GRID} relative min-h-20 border-b border-rule px-4 py-2.5 transition-colors hover:bg-muted/70 md:min-h-[76px] md:px-6 xl:min-h-[68px] xl:px-8"
		>
			<InitialsAvatar
				name={item.name}
				size={44}
				class="text-base font-extrabold text-avatar-foreground"
			/>
			<div class="flex min-w-0 flex-col gap-[5px] md:gap-[3px]">
				<p class="flex min-w-0 items-baseline gap-2">
					<!-- The name link covers the whole row; the send button sits above it. -->
					<a
						href={resolve('/(app)/customers/[id]', { id: item.id })}
						class="truncate text-[15px] leading-5 font-semibold outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
						>{item.name}</a
					>
					{#if inactive}
						<span class="shrink-0 text-xs font-semibold text-muted-foreground xl:hidden"
							>{customerStatusLabel(item.status)}</span
						>
					{/if}
				</p>
				<p
					class="hidden truncate text-[13px] leading-[18px] text-muted-foreground num md:block xl:hidden"
				>
					{formatPhone(item.phone)}{#if item.lastOrder}&nbsp;· {orderShort(item.lastOrder)}{/if}
				</p>
				<div class="md:hidden">{@render stock(item)}</div>
			</div>
			<div class="hidden min-w-0 md:block">{@render stock(item)}</div>
			<p class="hidden truncate text-sm num xl:block">
				{item.lastOrder ? orderText(item.lastOrder) : '—'}
			</p>
			<p class="hidden truncate text-sm num xl:block">{formatPhone(item.phone)}</p>
			<span
				class={cn(
					'hidden truncate text-[13px] xl:block',
					inactive ? 'text-muted-foreground' : 'font-semibold'
				)}>{customerStatusLabel(item.status)}</span
			>
			<WaIconButton
				href={waLink(item.phone)}
				label={m.customers_send_to({ name: item.name })}
				text={m.queue_send()}
				class="relative z-10 justify-self-end"
			/>
		</li>
	{/each}
</ul>
