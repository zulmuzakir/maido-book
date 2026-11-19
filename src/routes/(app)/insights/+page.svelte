<script lang="ts">
	import SectionHeading from '#lib/components/section-heading.svelte';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { formatRupiah, formatRupiahCompact } from '#lib/format.ts';
	import { formatDate, formatMonth } from '#lib/domain/dates.ts';
	import { customerStatusLabel, outcomeLabel } from '#lib/labels.ts';
	import { CUSTOMER_STATUSES, type FollowUpOutcome } from '#lib/domain/types.ts';
	import PageHeader from '#lib/components/page-header.svelte';
	import MonthPicker from '#lib/components/month-picker.svelte';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import DailyRevenueChart from '#lib/components/daily-revenue-chart.svelte';
	import * as Table from '#lib/components/ui/table/index.js';

	let { data }: PageProps = $props();

	const locale = $derived(getLocale() === 'id' ? 'id-ID' : 'en-GB');
	const ins = $derived(data.insights);

	const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
	const share = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
	const monthOf = (month: string) => `${month}-01T00:00:00Z`;
	const previousMonth = $derived.by(() => {
		const [year, month] = data.month.split('-').map(Number);
		return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
	});

	const monthName = $derived(
		new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
			new Date(monthOf(data.month))
		)
	);

	const pctFormat = $derived(
		new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
	);

	// Revenue delta against last month. Hidden when last month had no revenue to compare with.
	const revenueSub = $derived.by(() => {
		if (ins.previousRevenue === 0) return undefined;
		const change = (ins.revenueThisMonth - ins.previousRevenue) / ins.previousRevenue;
		const arrow = change >= 0 ? '↑' : '↓';
		return {
			text: m.insights_vs_month({
				change: `${arrow}${pctFormat.format(Math.abs(change))}`,
				month: formatMonth(previousMonth, getLocale(), 'longName')
			}),
			up: change >= 0
		};
	});

	// Legend and stacked-bar order differs from FOLLOW_UP_OUTCOMES: ordered first, replied before interested.
	const OUTCOME_ORDER: FollowUpOutcome[] = [
		'ordered',
		'replied',
		'interested',
		'no_reply',
		'not_interested'
	];
	const outcomeBar: Record<FollowUpOutcome, string> = {
		ordered: 'bg-status-done',
		replied: 'bg-chart-2',
		interested: 'bg-chart-1',
		no_reply: 'bg-chart-4',
		not_interested: 'bg-chart-5'
	};
	const outcomes = $derived(
		OUTCOME_ORDER.map((o) => ({
			key: o,
			label: outcomeLabel(o),
			bar: outcomeBar[o],
			count: ins.outcomesThisMonth[o]
		}))
	);
	const outcomeTotal = $derived(outcomes.reduce((sum, o) => sum + o.count, 0));

	const customerBar: Record<(typeof CUSTOMER_STATUSES)[number], string> = {
		lead: 'bg-chart-2',
		active: 'bg-chart-1',
		dormant: 'bg-chart-4'
	};
	const customers = $derived(
		CUSTOMER_STATUSES.map((s) => ({
			key: s,
			label: customerStatusLabel(s),
			bar: customerBar[s],
			count: ins.customersByStatus[s]
		}))
	);
	const customerTotal = $derived(customers.reduce((sum, c) => sum + c.count, 0));
</script>

{#snippet stackBar(parts: { key: string; bar: string; count: number }[], total: number)}
	<div class="flex h-3 overflow-hidden rounded-lg bg-rule" aria-hidden="true">
		{#each parts as p (p.key)}
			<div class="h-full {p.bar}" style:width="{(p.count / total) * 100}%"></div>
		{/each}
	</div>
{/snippet}

{#snippet kpi(label: string, value: string, sub?: string, subClass = 'text-muted-foreground')}
	<div class="flex flex-col gap-1.5">
		<span class="text-ui text-muted-foreground">{label}</span>
		<span
			class="text-[22px] leading-[110%] font-bold tracking-[-0.03em] num md:text-[30px] md:leading-[110%]"
		>
			{value}
		</span>
		{#if sub}
			<span class="text-xs font-medium {subClass}">{sub}</span>
		{/if}
	</div>
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader title={data.title} metaInline="md">
		{#snippet meta()}
			<span class="hidden xl:inline">{m.insights_intro({ month: monthName })}</span>
			<span class="xl:hidden">{monthName}</span>
		{/snippet}
		{#snippet actions()}
			<MonthPicker
				variant="select"
				month={data.month}
				today={data.today}
				hrefFor={(mo) => `${resolve('/(app)/insights')}?month=${mo}`}
			/>
		{/snippet}
	</PageHeader>

	<div class="mx-auto max-w-[75.5rem] space-y-5 px-4 py-3.5 md:space-y-7 md:px-6 md:py-6 xl:px-7">
		<section class="grid grid-cols-2 gap-x-4 gap-y-5 md:gap-x-6 md:gap-y-7 xl:grid-cols-4 xl:gap-8">
			{@render kpi(
				m.insights_revenue(),
				formatRupiahCompact(ins.revenueThisMonth),
				revenueSub?.text,
				revenueSub?.up ? 'text-status-done' : 'text-status-overdue'
			)}
			{@render kpi(
				m.insights_orders(),
				String(ins.ordersThisMonth),
				m.insights_repeat_sub({ count: ins.repeatOrdersThisMonth })
			)}
			{@render kpi(m.insights_contacts(), String(ins.contactsThisMonth), m.insights_this_month())}
			{@render kpi(
				m.insights_conversion(),
				pct(ins.conversion),
				m.insights_conversion_sub({ orders: ins.ordersThisMonth, messages: ins.contactsThisMonth })
			)}
		</section>

		<div
			class="grid gap-5 md:max-w-[690px] md:gap-7 xl:max-w-none xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10"
		>
			<section class="space-y-2.5 md:space-y-4" aria-labelledby="insights-daily-heading">
				<SectionHeading
					id="insights-daily-heading"
					size="sm"
					title={m.insights_daily_title()}
					description={m.insights_daily_sub()}
				/>
				<DailyRevenueChart days={ins.dailyRevenue} today={data.today} />
			</section>

			<section class="space-y-2.5 md:space-y-4" aria-labelledby="insights-outcomes-heading">
				<SectionHeading
					id="insights-outcomes-heading"
					size="sm"
					title={m.insights_panel_outcomes()}
					description={m.insights_outcomes_sub({ count: outcomeTotal })}
					mobileDescription={m.insights_outcomes_sub_short({ count: outcomeTotal })}
				/>
				{#if outcomeTotal === 0}
					<p class="text-sm text-muted-foreground">{m.insights_outcomes_empty()}</p>
				{:else}
					<div class="space-y-3.5">
						{@render stackBar(outcomes, outcomeTotal)}
						<ul>
							{#each outcomes as o (o.key)}
								<li class="flex h-8 items-center gap-2.5 text-ui max-md:h-6">
									<span class="size-[10px] rounded-[2px] {o.bar}" aria-hidden="true"></span>
									<span class="flex-1">{o.label}</span>
									<span class="text-ui font-semibold num">{share(o.count, outcomeTotal)}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</section>
		</div>

		{#if ins.winback.length}
			<section class="hidden space-y-1 xl:block" aria-labelledby="insights-winback-heading">
				<SectionHeading
					id="insights-winback-heading"
					size="sm"
					title={m.bucket_winback()}
					description={m.queue_winback_hint()}
				/>
				<ul>
					{#each ins.winback as w (w.customerId)}
						<li class="flex h-14 items-center gap-3 border-b border-row-rule">
							<PersonSummary
								name={w.name}
								href={resolve('/(app)/customers/[id]', { id: w.customerId })}
								nameClass="truncate text-sm font-semibold hover:underline"
								class="flex-1"
							>
								{#if w.lastOrderDate}
									<span class="text-xs text-muted-foreground">
										{m.insights_winback_order({
											date: formatDate(w.lastOrderDate, locale, 'short')
										})}
									</span>
								{/if}
							</PersonSummary>
							{#if w.daysOut !== null}
								<span class="text-ui font-semibold text-status-overdue">
									{m.stock_out_ago({ count: w.daysOut })}
								</span>
							{/if}
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		<section class="space-y-2" aria-labelledby="insights-history-heading">
			<h2 id="insights-history-heading" class="text-sm leading-[18px] font-semibold">
				{m.insights_panel_history()}
			</h2>
			<Table.Root class="table-fixed">
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="h-8 w-1/3 text-xs font-semibold text-muted-foreground">
							{m.insights_month_col()}
						</Table.Head>
						<Table.Head class="h-8 w-1/3 text-right text-xs font-semibold text-muted-foreground">
							{m.insights_orders_col()}
						</Table.Head>
						<Table.Head class="h-8 w-1/3 text-right text-xs font-semibold text-muted-foreground">
							{m.insights_revenue_col()}
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each ins.last6Months as row (row.month)}
						<Table.Row class="h-10 border-rule text-ui">
							<Table.Cell>{formatMonth(row.month, getLocale(), 'short')}</Table.Cell>
							<Table.Cell class="text-right num">{row.orders}</Table.Cell>
							<Table.Cell class="text-right font-semibold num"
								>{formatRupiah(row.revenue)}</Table.Cell
							>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</section>

		<section class="space-y-3" aria-labelledby="insights-customers-heading">
			<SectionHeading
				id="insights-customers-heading"
				size="sm"
				title={m.insights_panel_customers()}
				description={`${m.insights_repeat_rate()}: ${pct(ins.repeatCustomerRate)}`}
			/>
			{#if customerTotal === 0}
				<p class="text-sm text-muted-foreground">{m.insights_outcomes_empty()}</p>
			{:else}
				{@render stackBar(customers, customerTotal)}
				<ul>
					{#each customers as c (c.key)}
						<li class="border-b border-row-rule last:border-b-0">
							<a
								href="{resolve('/(app)/customers')}?status={c.key}"
								class="flex h-8 items-center gap-2.5 text-ui hover:underline max-md:h-6"
							>
								<span class="size-[10px] rounded-[2px] {c.bar}" aria-hidden="true"></span>
								<span class="flex-1">{c.label}</span>
								<span class="text-ui font-semibold num">{c.count}</span>
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
