<script lang="ts">
	import { resolve } from '$app/paths';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import { Button } from '#lib/components/ui/button/index.js';
	import EmptyState from '#lib/components/empty-state.svelte';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import GroupHeader from '#lib/components/group-header.svelte';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import MonthPicker from '#lib/components/month-picker.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import { formatRupiah } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const locale = $derived(getLocale());
	const summary = $derived(
		m.orders_summary({ count: data.count, revenue: formatRupiah(data.revenue) })
	);
	const monthHref = (month: string) => `${resolve('/(app)/orders')}?month=${month}`;
	const yesterday = $derived(addDays(data.today, -1));

	function dayLabel(date: string): string {
		if (date === data.today) return m.orders_today();
		if (date === yesterday) return m.orders_yesterday();
		return formatDate(date, locale, 'short');
	}

	// The query orders by date, so grouping keeps the newest day first.
	const days = $derived.by(() => {
		const groups: { date: string; items: typeof data.items }[] = [];
		for (const item of data.items) {
			const last = groups.at(-1);
			if (last && last.date === item.orderDate) last.items.push(item);
			else groups.push({ date: item.orderDate, items: [item] });
		}
		return groups;
	});
</script>

{#snippet amount(totalPaid: number | null)}
	{#if totalPaid === null}
		<span class="font-normal text-muted-foreground">{m.orders_total_unrecorded()}</span>
	{:else}
		{formatRupiah(totalPaid)}
	{/if}
{/snippet}

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="flex min-h-dvh flex-col bg-card">
	<PageHeader title={data.title} metaInline="md">
		{#snippet meta()}
			<p>{summary}</p>
			<div class="mt-3 md:hidden">
				<MonthPicker month={data.month} today={data.today} hrefFor={monthHref} />
			</div>
		{/snippet}
		{#snippet actions()}
			<div class="hidden items-center gap-1 md:flex desk:gap-2">
				<MonthPicker month={data.month} today={data.today} hrefFor={monthHref} />
				<Button href={resolve('/(app)/orders/new')} class="px-4 text-sm desk:px-4 desk:text-[13px]">
					<PlusIcon />
					{m.new_order()}
				</Button>
			</div>
		{/snippet}
	</PageHeader>

	<div class="page-frame flex grow flex-col">
		{#if data.items.length === 0}
			<div class="flex grow flex-col justify-center">
				<EmptyState
					icon={ReceiptTextIcon}
					title={m.orders_empty_title()}
					description={m.orders_empty()}
				>
					{#snippet actions()}
						<Button href={resolve('/(app)/orders/new')} class="h-10 px-3.5 text-[13px] desk:h-10">
							<PlusIcon class="size-[15px]" />
							{m.new_order()}
						</Button>
					{/snippet}
				</EmptyState>
			</div>
		{:else}
			<div class="hidden md:block">
				<table class="w-full text-left text-sm">
					<thead class="bg-subtle text-xs font-semibold text-muted-foreground">
						<tr class="h-9">
							<th scope="col" class="w-[92px] pr-4 pl-5 font-semibold">{m.orders_col_date()}</th>
							<th scope="col" class="pr-4 pl-[52px] font-semibold">{m.orders_col_customer()}</th>
							<th scope="col" class="w-[112px] pr-4 font-semibold">{m.orders_col_quantity()}</th>
							<th scope="col" class="w-[130px] pr-5 text-right font-semibold">
								{m.orders_col_total()}
							</th>
						</tr>
					</thead>
					<tbody>
						{#each data.items as item (item.id)}
							<tr class="h-14 border-b border-row-rule">
								<td class="w-[92px] pr-4 pl-5 text-[13px] text-muted-foreground num">
									{formatDate(item.orderDate, locale, 'short')}
								</td>
								<td class="pr-4">
									<a
										href={resolve('/(app)/customers/[id]', { id: item.customerId })}
										class="inline-flex items-center gap-4 rounded-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
									>
										<InitialsAvatar name={item.customerName} size={36} />
										<span class="min-w-0 truncate">{item.customerName}</span>
									</a>
								</td>
								<td class="w-[112px] pr-4 text-[13px] whitespace-nowrap" title={item.productName}>
									<span class="num">{item.qty}</span>
									{item.unitLabel}
								</td>
								<td class="w-[130px] pr-5 text-right font-semibold num">
									{@render amount(item.totalPaid)}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<div class="space-y-0 md:hidden">
				{#each days as day (day.date)}
					<section class="-mx-4" aria-labelledby={`day-${day.date}`}>
						<GroupHeader
							id={`day-${day.date}`}
							label={dayLabel(day.date)}
							labelClass="num"
							count={day.items.length}
							class="px-4 md:px-6 xl:px-8"
						/>
						<ul>
							{#each day.items as item (item.id)}
								<li class="border-b border-row-rule">
									<a
										href={resolve('/(app)/customers/[id]', { id: item.customerId })}
										class="flex h-16 items-center gap-3 px-4 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
									>
										<PersonSummary
											name={item.customerName}
											avatarSize={40}
											nameClass="truncate text-[15px] font-semibold"
											class="flex-1"
										>
											<p class="truncate text-xs text-muted-foreground">
												<span class="num">{formatDate(item.orderDate, locale, 'short')}</span>
												·
												<span class="num">{item.qty}</span>
												{item.unitLabel}
											</p>
										</PersonSummary>
										<p class="w-max shrink-0 text-sm font-semibold num">
											{@render amount(item.totalPaid)}
										</p>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</div>
</div>
