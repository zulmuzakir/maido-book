<script lang="ts">
	import { resolve } from '$app/paths';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import ReceiptTextIcon from '@lucide/svelte/icons/receipt-text';
	import { Button } from '#lib/components/ui/button/index.js';
	import EmptyState from '#lib/components/empty-state.svelte';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import MonthPicker from '#lib/components/month-picker.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { formatMonth, monthKey } from '#lib/domain/dates.ts';
	import { formatRupiah } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const locale = $derived(getLocale());
	const monthHref = (month: string) => `${resolve('/(app)/orders')}?month=${month}`;
	const monthName = $derived(formatMonth(data.month, locale, 'long'));
	const isCurrent = $derived(data.month === monthKey(data.today));
	const empty = $derived(data.items.length === 0);
	const average = $derived(data.recorded > 0 ? Math.round(data.revenue / data.recorded) : null);

	const dayFmt = $derived(
		new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			timeZone: 'UTC'
		})
	);

	// The query orders by date, so grouping keeps the newest day first.
	const days = $derived.by(() => {
		const groups: { date: string; items: typeof data.items; total: number }[] = [];
		for (const item of data.items) {
			const last = groups.at(-1);
			if (last && last.date === item.orderDate) {
				last.items.push(item);
				last.total += item.totalPaid ?? 0;
			} else groups.push({ date: item.orderDate, items: [item], total: item.totalPaid ?? 0 });
		}
		return groups;
	});

	// Desktop: avatar | Pelanggan | Jumlah | Total. Tablet/phone: name over the quantity | total.
	const ROW = 'grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-x-3.5 md:gap-x-4';
	const ROW_XL = 'xl:grid-cols-[44px_minmax(0,1fr)_160px_160px]';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- month links are resolve() plus a ?month= query -->

{#snippet amount(totalPaid: number | null)}
	{#if totalPaid === null}
		<span class="font-normal text-muted-foreground">{m.orders_total_unrecorded()}</span>
	{:else}
		{formatRupiah(totalPaid)}
	{/if}
{/snippet}

{#snippet thisMonth(cls: string)}
	{#if !isCurrent}
		<a
			href={monthHref(monthKey(data.today))}
			class={cn(
				'inline-flex h-11 items-center rounded-sm px-2 text-sm font-semibold text-primary-text outline-none focus-visible:ring-3 focus-visible:ring-ring',
				cls
			)}>{m.orders_this_month()}</a
		>
	{/if}
{/snippet}

<!-- Desktop: month picker, "Bulan ini" and "Order baru" in the header. Tablet: the picker gets its
     own row. Phone: a full-width picker; "Bulan ini" moves to the header's right. -->
<div class="flex min-h-dvh flex-col bg-card">
	<PageHeader title={data.title} metaInline="md" class="xl:border-b">
		{#snippet meta()}
			<span class="num">
				{empty ? m.orders_summary({ count: 0, revenue: formatRupiah(0) }) : monthName}
			</span>
		{/snippet}
		{#snippet actions()}
			{@render thisMonth('md:hidden')}
			<div class="hidden items-center gap-2.5 xl:flex">
				<MonthPicker month={data.month} today={data.today} hrefFor={monthHref} />
				{@render thisMonth('')}
			</div>
			<Button href={resolve('/(app)/orders/new')} class="hidden font-semibold md:inline-flex">
				<PlusIcon class="size-[18px]" aria-hidden="true" />
				{m.new_order()}
			</Button>
		{/snippet}
	</PageHeader>

	<div class="flex items-center gap-2.5 px-4 pb-3.5 md:px-6 xl:hidden">
		<MonthPicker
			month={data.month}
			today={data.today}
			hrefFor={monthHref}
			class="w-full md:w-auto"
		/>
		{@render thisMonth('hidden md:inline-flex')}
	</div>

	{#if empty}
		<div class="flex grow flex-col justify-center pb-10">
			<EmptyState
				icon={ReceiptTextIcon}
				tone="brand"
				title={m.orders_empty_title()}
				description={m.orders_empty_month({ month: monthName })}
			>
				{#snippet actions()}
					<Button href={resolve('/(app)/orders/new')}>
						<PlusIcon class="size-[18px]" aria-hidden="true" />
						{m.new_order()}
					</Button>
				{/snippet}
			</EmptyState>
		</div>
	{:else}
		<dl class="flex gap-6 px-4 pb-3.5 md:gap-10 md:px-6 md:pb-4 xl:px-8 xl:pt-4">
			<div>
				<dt class="text-[12.5px] text-muted-foreground">{m.orders_kpi_count()}</dt>
				<dd class="mt-0.5 text-xl leading-7 font-bold tracking-[-0.02em] num md:text-2xl">
					{data.count}
				</dd>
			</div>
			<div>
				<dt class="text-[12.5px] text-muted-foreground">{m.orders_col_total()}</dt>
				<dd class="mt-0.5 text-xl leading-7 font-bold tracking-[-0.02em] num md:text-2xl">
					{formatRupiah(data.revenue)}
				</dd>
			</div>
			{#if average !== null}
				<div class="hidden md:block">
					<dt class="text-[12.5px] text-muted-foreground">{m.orders_kpi_average()}</dt>
					<dd class="mt-0.5 text-2xl leading-7 font-bold tracking-[-0.02em] num">
						{formatRupiah(average)}
					</dd>
				</div>
			{/if}
		</dl>

		<div
			class="{ROW} {ROW_XL} hidden h-9 px-8 text-xs font-semibold text-muted-foreground xl:grid"
			aria-hidden="true"
		>
			<span></span>
			<span>{m.orders_col_customer()}</span>
			<span>{m.orders_col_quantity()}</span>
			<span class="text-right">{m.orders_col_total()}</span>
		</div>

		{#each days as day (day.date)}
			<section aria-labelledby="day-{day.date}">
				<h2
					id="day-{day.date}"
					class="-mt-px flex h-[38px] items-center justify-between border-y border-rule bg-secondary px-4 text-[13px] font-bold text-band-title md:px-6 xl:px-8"
				>
					<span>
						{dayFmt.format(new Date(`${day.date}T00:00:00Z`))}
						<span class="ml-1.5 font-medium text-muted-foreground"
							>{m.orders_day_count({ count: day.items.length })}</span
						>
					</span>
					<span class="num">{formatRupiah(day.total)}</span>
				</h2>
				<ul>
					{#each day.items as item (item.id)}
						<li class="border-b border-rule last:border-b-0">
							<a
								href={resolve('/(app)/customers/[id]', { id: item.customerId })}
								class="{ROW} {ROW_XL} min-h-16 px-4 py-2 outline-none hover:bg-muted/70 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:px-6 xl:min-h-[60px] xl:px-8"
							>
								<InitialsAvatar
									name={item.customerName}
									size={40}
									class="font-extrabold text-avatar-foreground"
								/>
								<div class="min-w-0">
									<p class="truncate text-[15px] leading-5 font-semibold">{item.customerName}</p>
									<p class="mt-0.5 text-[13px] text-muted-foreground num xl:hidden">
										{m.queue_row_qty({ qty: item.qty, unit: item.unitLabel })}
									</p>
								</div>
								<p class="hidden text-sm text-muted-foreground num xl:block">
									{m.queue_row_qty({ qty: item.qty, unit: item.unitLabel })}
								</p>
								<p class="text-right text-[15px] font-semibold num">
									{@render amount(item.totalPaid)}
								</p>
							</a>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{/if}
</div>
