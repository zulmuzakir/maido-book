<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '#lib/components/ui/alert-dialog/index.js';
	import StockText from '#lib/components/stock-text.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { supplySteps } from '#lib/domain/supply.ts';
	import { formatRupiah } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageData } from './$types';

	let {
		orders,
		today,
		leadDays,
		truncated
	}: {
		orders: PageData['orders'];
		today: string;
		leadDays: number;
		truncated: boolean;
	} = $props();

	const locale = getLocale() === 'id' ? 'id' : 'en';

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

<h2
	class="pb-2 text-[15px] leading-[18px] font-semibold md:pb-1.5 md:text-sm md:leading-[18px] md:font-bold"
>
	{m.customer_tab_orders()}
</h2>
{#if orders.length === 0}
	<p class="py-4 text-sm text-muted-foreground">{m.customer_no_orders()}</p>
{:else}
	<ul>
		{#each orders as o, i (o.id)}
			{@const gap = gapBefore(i)}
			<li
				class="flex min-h-14 items-center gap-3 border-b border-rule py-2 md:h-[52px] md:min-h-0 md:border-row-rule md:py-0"
			>
				<span class="w-14 shrink-0 text-ui font-semibold num">
					{formatDate(o.orderDate, locale, 'short')}
				</span>
				<div class="min-w-0 flex-1">
					<p
						class="truncate text-[15px] leading-[18px] font-normal md:text-sm md:leading-[18px] md:font-medium"
					>
						{o.qty}
						{o.unitLabel}
						{o.productName}
					</p>
					{#if i === 0 && latest}
						{#if outNow && newest}
							<p class="text-xs text-status-overdue">
								{m.customer_order_out({
									date: formatDate(newest.runsOutOn, locale, 'medium'),
									count: -newest.daysLeft
								})}
							</p>
						{:else}
							<p class="text-xs">
								<StockText lastOrder={latest} {today} {leadDays} />
							</p>
						{/if}
					{:else if gap > 0}
						<p class="text-xs text-muted-foreground">
							{m.customer_order_gap({ count: gap })}
						</p>
					{/if}
					{#if o.note}
						<p class="text-xs break-words whitespace-pre-line text-muted-foreground">
							{o.note}
						</p>
					{/if}
				</div>
				<span class="shrink-0 text-ui font-semibold num">
					{o.totalPaid != null ? formatRupiah(o.totalPaid) : m.customer_order_no_total()}
				</span>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button
								{...props}
								variant="ghost"
								size="icon"
								aria-label={m.customer_action_more()}
								class="size-11 shrink-0 text-muted-foreground desk:size-10"
							>
								<EllipsisIcon class="size-4" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item
							variant="destructive"
							onSelect={() => {
								pendingOrderId = o.id;
								orderDeleteOpen = true;
							}}
						>
							<Trash2Icon class="size-4" />
							{m.customer_order_delete()}
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</li>
		{/each}
	</ul>
	{#if truncated}
		<p class="mt-3 text-ui leading-[18px] text-muted-foreground">{m.customer_history_cap_body()}</p>
	{/if}
{/if}

<AlertDialog bind:open={orderDeleteOpen}>
	<AlertDialogContent>
		<form method="post" action="?/deleteOrder" use:enhance={deleteOrderAction.enhance}>
			<AlertDialogHeader>
				<AlertDialogTitle>{m.customer_order_delete_title()}</AlertDialogTitle>
				<AlertDialogDescription>
					{m.customer_order_delete_description()}
				</AlertDialogDescription>
			</AlertDialogHeader>
			<input type="hidden" name="orderId" value={pendingOrderId ?? ''} />
			<AlertDialogFooter class="mt-4">
				<AlertDialogCancel type="button">{m.cancel()}</AlertDialogCancel>
				<AlertDialogAction
					type="submit"
					variant="destructive-solid"
					disabled={deleteOrderAction.pending}
				>
					{m.customer_order_delete()}
				</AlertDialogAction>
			</AlertDialogFooter>
		</form>
	</AlertDialogContent>
</AlertDialog>
