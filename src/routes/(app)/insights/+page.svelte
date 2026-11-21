<script lang="ts">
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { m } from '#lib/paraglide/messages.js';
	import { formatRupiahCompact } from '#lib/format.ts';
	import { formatDate, formatMonth } from '#lib/domain/dates.ts';
	import { customerStatusLabel, outcomeLabel } from '#lib/labels.ts';
	import { CUSTOMER_STATUSES, type FollowUpOutcome } from '#lib/domain/types.ts';
	import PageHeader from '#lib/components/page-header.svelte';
	import MonthPicker from '#lib/components/month-picker.svelte';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import WaIconButton from '#lib/components/wa-icon-button.svelte';
	import DailyRevenueChart from '#lib/components/daily-revenue-chart.svelte';
	import { cn } from '#lib/utils.js';

	let { data }: PageProps = $props();

	const lang = $derived(getLocale());
	const locale = $derived(lang === 'id' ? 'id-ID' : 'en-GB');
	const ins = $derived(data.insights);

	const pct = (v: number | null) => (v === null ? '—' : `${Math.round(v * 100)}%`);
	const share = (n: number, total: number) => (total ? `${Math.round((n / total) * 100)}%` : '0%');
	const previousMonth = $derived.by(() => {
		const [year, month] = data.month.split('-').map(Number);
		return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`;
	});
	const monthName = $derived(formatMonth(data.month, lang, 'long'));
	const digits = $derived(new Intl.NumberFormat(locale));
	const pctFormat = $derived(
		new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 })
	);

	// Revenue delta against last month. Hidden when last month had no revenue to compare with.
	const delta = $derived.by(() => {
		if (ins.previousRevenue === 0) return null;
		const change = (ins.revenueThisMonth - ins.previousRevenue) / ins.previousRevenue;
		return {
			change: `${change >= 0 ? '↑' : '↓'} ${pctFormat.format(Math.abs(change))}`,
			month: formatMonth(previousMonth, lang, 'longName')
		};
	});

	// "1–9 November": the days the chart covers.
	const dailyRange = $derived.by(() => {
		const days = ins.dailyRevenue;
		if (!days.length) return formatMonth(data.month, lang, 'longName');
		const first = Number(days[0].date.slice(8));
		const last = Number(days[days.length - 1].date.slice(8));
		const name = formatMonth(data.month, lang, 'longName');
		return first === last ? `${first} ${name}` : `${first}–${last} ${name}`;
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
		ordered: 'bg-chart-1',
		replied: 'bg-chart-3',
		interested: 'bg-chart-2',
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
		lead: 'bg-chart-3',
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

	const maxRevenue = $derived(Math.max(1, ...ins.last6Months.map((r) => r.revenue)));
	const queueHref = (followUpId: string) =>
		`${resolve('/(app)')}?item=${encodeURIComponent(followUpId)}`;

	// Desktop: plain figures over a hairline. Tablet/phone: bordered cards, two by two.
	const KPI =
		'flex min-w-0 flex-col gap-1 rounded-[10px] border border-rule px-4 py-3.5 xl:border-0 xl:p-0';
	const H2 = 'text-base leading-5 font-bold tracking-[-0.01em]';
	const SUB = 'mt-0.5 text-[13.5px] leading-5 text-muted-foreground';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- hrefs carry a query on a resolved path -->

{#snippet stackBar(parts: { key: string; bar: string; count: number }[], total: number)}
	<div class="flex h-2.5 gap-0.5 overflow-hidden rounded-[5px]" aria-hidden="true">
		{#each parts as p (p.key)}
			{#if p.count > 0}
				<div class="h-full {p.bar}" style:width="{(p.count / total) * 100}%"></div>
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet legendRow(bar: string, label: string, value: string)}
	<span class="size-2.5 shrink-0 rounded-[3px] {bar}" aria-hidden="true"></span>
	<span class="flex-1">{label}</span>
	<span class="font-semibold num">{value}</span>
{/snippet}

{#snippet kpi(
	label: string,
	short: string,
	value: string,
	sub: string,
	subShort: string,
	strong = false
)}
	<div class={KPI}>
		<span class="text-[13px] font-medium text-muted-foreground">
			<span class="md:hidden">{short}</span><span class="hidden md:inline">{label}</span>
		</span>
		<span class="text-[26px] leading-[1.1] font-bold tracking-[-0.03em] num md:text-[30px]">
			{value}
		</span>
		{#if sub}
			<span
				class={cn('text-[13px] leading-[18px] text-muted-foreground', strong && 'font-semibold')}
			>
				<span class="md:hidden">{subShort}</span><span class="hidden md:inline">{sub}</span>
			</span>
		{/if}
	</div>
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		back={{ href: resolve('/(app)/more'), label: m.nav_more() }}
		variant="subpage"
		backMobileOnly
		metaInline="md"
	>
		{#snippet meta()}{m.insights_intro({ month: monthName })}{/snippet}
		{#snippet actions()}
			<MonthPicker
				variant="select"
				month={data.month}
				today={data.today}
				hrefFor={(mo) => `${resolve('/(app)/insights')}?month=${mo}`}
			/>
		{/snippet}
	</PageHeader>

	<div class="flex flex-col gap-7 px-4 pt-1 pb-8 md:px-6 md:py-5 xl:px-8 xl:py-6">
		<section
			class="grid grid-cols-2 gap-2.5 xl:grid-cols-4 xl:gap-6 xl:border-b xl:border-rule xl:pb-6"
			aria-label={m.nav_insights()}
		>
			{@render kpi(
				m.insights_revenue(),
				m.insights_revenue(),
				formatRupiahCompact(ins.revenueThisMonth),
				delta ? m.insights_vs_month(delta) : '',
				delta ? m.insights_vs_month_short(delta) : '',
				true
			)}
			{@render kpi(
				m.insights_orders(),
				m.insights_orders(),
				String(ins.ordersThisMonth),
				m.insights_repeat_sub({ count: ins.repeatOrdersThisMonth }),
				m.insights_repeat_sub_short({ count: ins.repeatOrdersThisMonth })
			)}
			{@render kpi(
				m.insights_contacts(),
				m.insights_contacts(),
				String(ins.contactsThisMonth),
				m.insights_this_month(),
				m.insights_this_month()
			)}
			{@render kpi(
				m.insights_conversion(),
				m.insights_conversion_short(),
				pct(ins.conversion),
				m.insights_conversion_sub({
					orders: ins.convertedOrdersThisMonth,
					messages: ins.contactsThisMonth
				}),
				m.insights_conversion_sub_short({
					orders: ins.convertedOrdersThisMonth,
					messages: ins.contactsThisMonth
				})
			)}
		</section>

		<div class="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start xl:gap-12">
			<section class="flex min-w-0 flex-col gap-2.5" aria-labelledby="insights-daily-heading">
				<div>
					<h2 id="insights-daily-heading" class={H2}>{m.insights_daily_title()}</h2>
					<p class={SUB}>{m.insights_daily_sub({ range: dailyRange })}</p>
				</div>
				<DailyRevenueChart days={ins.dailyRevenue} today={data.today} />
			</section>

			<section class="flex flex-col gap-3" aria-labelledby="insights-outcomes-heading">
				<div>
					<h2 id="insights-outcomes-heading" class={H2}>{m.insights_panel_outcomes()}</h2>
					<p class={SUB}>{m.insights_outcomes_sub({ count: outcomeTotal })}</p>
				</div>
				{#if outcomeTotal === 0}
					<p class="text-sm text-muted-foreground">{m.insights_outcomes_empty()}</p>
				{:else}
					{@render stackBar(outcomes, outcomeTotal)}
					<ul>
						{#each outcomes as o (o.key)}
							<li class="flex h-10 items-center gap-2.5 border-b border-rule text-sm">
								{@render legendRow(o.bar, o.label, share(o.count, outcomeTotal))}
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		</div>

		<div class="grid gap-7 xl:grid-cols-2 xl:items-start xl:gap-12">
			{#if ins.winback.length}
				<section class="flex flex-col" aria-labelledby="insights-winback-heading">
					<div class="flex items-end justify-between gap-4">
						<div class="min-w-0">
							<h2 id="insights-winback-heading" class={H2}>{m.bucket_winback()}</h2>
							<p class={SUB}>{m.insights_winback_hint()}</p>
						</div>
						<a
							href="{resolve('/(app)')}?tab=winback"
							class="hidden shrink-0 text-[13.5px] font-semibold whitespace-nowrap text-primary-text hover:underline md:inline"
							>{m.customer_open_in_queue()}</a
						>
					</div>
					<ul>
						{#each ins.winback as w (w.customerId)}
							{@const out = w.daysOut !== null ? m.stock_out_ago({ count: w.daysOut }) : null}
							<li class="flex min-h-16 items-center gap-3 border-b border-rule">
								<InitialsAvatar name={w.name} size={40} class="font-extrabold" />
								<div class="min-w-0 flex-1">
									<a
										href={resolve('/(app)/customers/[id]', { id: w.customerId })}
										class="block truncate text-[15px] font-semibold hover:underline">{w.name}</a
									>
									<p class="mt-0.5 truncate text-[13px] text-muted-foreground">
										{#if w.lastOrderDate}{m.insights_winback_order({
												date: formatDate(w.lastOrderDate, lang, 'short')
											})}{/if}{#if out}<span class="md:hidden"
												>{w.lastOrderDate ? ' · ' : ''}{out}</span
											>{/if}
									</p>
								</div>
								{#if out}
									<span
										class="hidden text-[13px] font-semibold whitespace-nowrap text-status-overdue md:inline"
										>{out}</span
									>
								{/if}
								<WaIconButton
									href={queueHref(w.followUpId)}
									external={false}
									label={m.insights_winback_send({ name: w.name })}
									text={m.queue_send()}
								/>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<section class="flex flex-col gap-1.5" aria-labelledby="insights-history-heading">
				<h2 id="insights-history-heading" class={H2}>{m.insights_panel_history()}</h2>
				<table class="w-full text-sm num">
					<thead>
						<tr
							class="h-[34px] border-b border-rule text-left text-xs font-semibold text-muted-foreground"
						>
							<th class="w-[60px] font-semibold xl:w-16">{m.insights_month_col()}</th>
							<th class="font-semibold xl:w-[60px] xl:text-right">{m.insights_orders_col()}</th>
							<th class="hidden xl:table-cell"
								><span class="sr-only">{m.insights_revenue()}</span></th
							>
							<th class="w-[130px] text-right font-semibold">{m.insights_revenue_col()}</th>
						</tr>
					</thead>
					<tbody>
						{#each ins.last6Months as row (row.month)}
							{@const current = row.month === data.month}
							{@const fill = (row.revenue / maxRevenue) * 100}
							<tr class="h-11 border-b border-rule">
								<td class={current ? 'font-bold' : 'font-medium'}>
									{formatMonth(row.month, lang, 'short')}
								</td>
								<td class="pr-3.5 xl:pl-3.5">
									<!-- Tablet/phone: the count and its bar share a cell. Desktop: separate columns. -->
									<div class="flex items-center gap-2">
										<span class="w-[22px] shrink-0 text-right xl:w-full">{row.orders}</span>
										<div class="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-track xl:hidden">
											<div
												class={cn('h-full', current ? 'bg-primary' : 'bg-chart-bar')}
												style:width="{fill}%"
											></div>
										</div>
									</div>
								</td>
								<td class="hidden pr-3.5 xl:table-cell">
									<div class="h-2 overflow-hidden rounded-[4px] bg-track">
										<div
											class={cn('h-full rounded-[4px]', current ? 'bg-primary' : 'bg-chart-bar')}
											style:width="{fill}%"
										></div>
									</div>
								</td>
								<td class="text-right font-semibold">{digits.format(row.revenue)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</section>
		</div>

		<section
			class="flex flex-col gap-3 xl:max-w-[calc(50%-24px)]"
			aria-labelledby="insights-customers-heading"
		>
			<div>
				<h2 id="insights-customers-heading" class={H2}>{m.insights_panel_customers()}</h2>
				<p class={SUB}>{m.insights_repeat_rate_value({ rate: pct(ins.repeatCustomerRate) })}</p>
			</div>
			{#if customerTotal === 0}
				<p class="text-sm text-muted-foreground">{m.insights_outcomes_empty()}</p>
			{:else}
				{@render stackBar(customers, customerTotal)}
				<ul>
					{#each customers as c (c.key)}
						<li class="border-b border-rule">
							<a
								href="{resolve('/(app)/customers')}?status={c.key}"
								class="flex h-10 items-center gap-2.5 text-sm hover:underline"
							>
								{@render legendRow(c.bar, c.label, String(c.count))}
							</a>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
