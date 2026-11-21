<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import StockText from '#lib/components/stock-text.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { supplySteps } from '#lib/domain/supply.ts';
	import { formatRupiah } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageData } from './$types';

	let {
		orders,
		today,
		leadDays,
		truncated,
		class: className
	}: {
		orders: PageData['orders'];
		today: string;
		leadDays: number;
		truncated: boolean;
		class?: string;
	} = $props();

	const locale = $derived(getLocale() === 'id' ? 'id' : 'en');
	const dayFmt = $derived(
		new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
			day: 'numeric',
			timeZone: 'UTC'
		})
	);
	const monthFmt = $derived(
		new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
			month: 'short',
			timeZone: 'UTC'
		})
	);
	const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);
	// Same grid for the desktop header row and every order row.
	const cols =
		'grid grid-cols-[44px_minmax(0,1fr)_auto_44px] items-center gap-x-3 xl:grid-cols-[90px_minmax(0,1fr)_130px_40px] xl:gap-x-4';

	const latest = $derived(orders[0] ?? null);
	const newest = $derived(
		latest
			? supplyStatus({
					orderDate: latest.orderDate,
					daysSupply: latest.daysSupply,
					today
				})
			: null
	);
	const outNow = $derived(newest !== null && newest.daysLeft < 0);

	const steps = $derived(supplySteps(orders));
	/** Days without stock before the next-newer order arrived, for the order at index `i`. */
	function gapBefore(i: number): number {
		if (i === 0) return 0;
		const step = steps[steps.length - i];
		return step && step.before < 0 ? -step.before : 0;
	}

	let orderDeleteOpen = $state(false);
	let pendingOrderId = $state<string | null>(null);
	const deleteOrderAction = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') toast.success(m.customer_order_deleted());
		await update();
	});
</script>

<!-- Desktop: a Tanggal | Order | Total header and 56px rows. Tablet/phone: the date stacked as a
     big day over the month. Each row keeps its ⋯ menu so a mistyped order can be deleted. -->
<section class={cn('flex flex-col', className)}>
	<h2 class="pb-2 text-[17px] leading-[22px] font-bold">
		{truncated ? m.customer_orders_recent({ count: orders.length }) : m.customer_tab_orders()}
	</h2>
	{#if orders.length === 0}
		<p class="py-4 text-sm text-muted-foreground">{m.customer_no_orders()}</p>
	{:else}
		<div
			class="{cols} hidden h-9 border-b border-rule text-[12.5px] font-semibold text-muted-foreground xl:grid"
			aria-hidden="true"
		>
			<span>{m.customer_order_col_date()}</span>
			<span>{m.customer_tab_orders()}</span>
			<span class="text-right">{m.customer_order_col_total()}</span>
		</div>
		<ul>
			{#each orders as o, i (o.id)}
				{@const gap = gapBefore(i)}
				<li class="{cols} min-h-16 border-b border-rule py-2.5 xl:min-h-14 xl:py-2">
					<span class="flex flex-col items-center leading-none num xl:hidden" aria-hidden="true">
						<span class="text-[17px] leading-[22px] font-bold"
							>{dayFmt.format(utc(o.orderDate))}</span
						>
						<span class="text-xs leading-4 text-muted-foreground">
							{monthFmt.format(utc(o.orderDate))}
						</span>
					</span>
					<span class="hidden text-[14.5px] font-semibold num xl:block">
						{formatDate(o.orderDate, locale, 'short')}
					</span>
					<div class="min-w-0 self-center">
						<p class="sr-only xl:hidden">{formatDate(o.orderDate, locale, 'medium')}</p>
						<p class="truncate text-[14.5px] leading-5 font-semibold">
							{m.order_items({ qty: o.qty, unit: o.unitLabel, product: o.productName })}
						</p>
						{#if i === 0 && latest}
							{#if outNow && newest}
								<p class="text-[13px] leading-[18px] text-status-overdue">
									{m.customer_order_out({
										date: formatDate(newest.runsOutOn, locale, 'short'),
										count: -newest.daysLeft
									})}
								</p>
							{:else}
								<p class="text-[13px] leading-[18px]">
									<StockText lastOrder={latest} {today} {leadDays} />
								</p>
							{/if}
						{:else if gap > 0}
							<p class="text-[13px] leading-[18px] text-muted-foreground">
								{m.customer_order_gap({ count: gap })}
							</p>
						{/if}
						{#if o.note}
							<p class="text-[13px] break-words whitespace-pre-line text-muted-foreground">
								{o.note}
							</p>
						{/if}
					</div>
					<span
						class="self-start pt-0.5 text-right text-[14.5px] font-semibold num xl:self-center xl:pt-0"
					>
						{o.totalPaid != null ? formatRupiah(o.totalPaid) : m.customer_order_no_total()}
					</span>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							{#snippet child({ props })}
								<Button
									{...props}
									variant="ghost"
									size="icon"
									aria-label={m.customer_order_menu({
										date: formatDate(o.orderDate, locale, 'medium')
									})}
									class="size-11 justify-self-end text-muted-foreground desk:size-10"
								>
									<EllipsisIcon aria-hidden="true" />
								</Button>
							{/snippet}
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Group>
								<DropdownMenu.Item
									variant="destructive"
									onSelect={() => {
										pendingOrderId = o.id;
										orderDeleteOpen = true;
									}}
								>
									<Trash2Icon aria-hidden="true" />
									{m.customer_order_delete()}
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</li>
			{/each}
		</ul>
	{/if}
</section>

<AlertDialog.Root bind:open={orderDeleteOpen}>
	<AlertDialog.Content>
		<form method="post" action="?/deleteOrder" use:enhance={deleteOrderAction.enhance}>
			<AlertDialog.Header>
				<AlertDialog.Title>{m.customer_order_delete_title()}</AlertDialog.Title>
				<AlertDialog.Description>
					{m.customer_order_delete_description()}
				</AlertDialog.Description>
			</AlertDialog.Header>
			<input type="hidden" name="orderId" value={pendingOrderId ?? ''} />
			<AlertDialog.Footer class="mt-4">
				<AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
				<AlertDialog.Action
					type="submit"
					variant="destructive-solid"
					disabled={deleteOrderAction.pending}
				>
					{m.customer_order_delete()}
				</AlertDialog.Action>
			</AlertDialog.Footer>
		</form>
	</AlertDialog.Content>
</AlertDialog.Root>
