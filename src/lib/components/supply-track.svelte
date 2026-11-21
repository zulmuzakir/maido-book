<script lang="ts" module>
	/** Days of red "out" band drawn past the run-out date, so a lapsed customer still has a place. */
	export const outTail = (daysSupply: number) => Math.max(7, Math.round(daysSupply * 0.2));
</script>

<script lang="ts">
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { addDays, diffDays, formatDate } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		orderDate,
		daysSupply,
		dueDate = null,
		today,
		leadDays,
		size = 'sm',
		label: showLabel = true,
		decorative = false,
		class: className
	}: {
		orderDate: string;
		daysSupply: number;
		dueDate?: string | null;
		today: string;
		leadDays: number;
		size?: 'sm' | 'lg';
		label?: boolean;
		/** Hides the track from assistive tech when the same state is already written next to it. */
		decorative?: boolean;
		class?: string;
	} = $props();

	const s = $derived(supplyStatus({ orderDate, daysSupply, today }));
	const span = $derived(Math.max(1, daysSupply + outTail(daysSupply)));
	const pct = (days: number) => `${(Math.min(span, Math.max(0, days)) / span) * 100}%`;
	const okEnd = $derived(pct(daysSupply - leadDays));
	const soonEnd = $derived(pct(daysSupply));
	const elapsed = $derived(diffDays(orderDate, today));
	const past = $derived(elapsed > span);
	const due = $derived(dueDate ? diffDays(orderDate, dueDate) : null);
	const week = $derived(`${(7 / span) * 100}% 100%`);

	const tone = $derived(
		s.daysLeft > leadDays
			? 'text-muted-foreground'
			: s.daysLeft > 0
				? 'text-status-today'
				: 'text-status-overdue'
	);
	const text = $derived(
		s.daysLeft > 0
			? m.gauge_days_left({ count: s.daysLeft })
			: s.daysLeft === 0
				? m.gauge_out_today()
				: m.gauge_out_ago({ count: -s.daysLeft })
	);
	// Inline wording for the small bar ("habis 3 hari lalu"); the large one leads with a headline.
	const smallText = $derived(
		s.daysLeft > 0
			? m.stock_days_left({ count: s.daysLeft })
			: s.daysLeft === 0
				? m.stock_out_today()
				: m.stock_out_ago({ count: -s.daysLeft })
	);
	const BAR_DAYS = 14;
	const barWidth = $derived(
		s.daysLeft <= 0 ? '100%' : `${(Math.min(BAR_DAYS, s.daysLeft) / BAR_DAYS) * 100}%`
	);
	const barColour = $derived(
		s.daysLeft > leadDays ? 'bg-band-ok' : s.daysLeft > 0 ? 'bg-band-soon' : 'bg-band-out'
	);
	const locale = $derived(getLocale());
	const legend = $derived([
		['bg-band-ok', m.track_legend_ok()],
		['bg-band-soon', m.track_legend_soon()],
		['bg-band-out', m.track_legend_out()]
	] as const);
</script>

{#snippet track(height: string)}
	<div
		class={cn('relative w-full', height)}
		role={decorative ? undefined : 'img'}
		aria-label={decorative ? undefined : text}
		aria-hidden={decorative || undefined}
	>
		<div class="absolute inset-0 flex overflow-hidden rounded-[2px]">
			<div class="h-full bg-band-ok" style:width={okEnd}></div>
			<div class="h-full bg-band-soon" style:width="calc({soonEnd} - {okEnd})"></div>
			<div class="h-full flex-1 bg-band-out"></div>
		</div>
		<!-- Used-up supply is washed out; what is left stays at full strength. -->
		<div class="absolute inset-y-0 left-0 bg-card/55" style:width={pct(elapsed)}></div>
		<div
			class="supply-weeks absolute inset-0 rounded-[2px]"
			style:background-size={week}
			aria-hidden="true"
		></div>
		{#if due !== null && size === 'lg'}
			<div
				class="absolute -bottom-1.5 h-1.5 w-px bg-foreground/60"
				style:left={pct(due)}
				aria-hidden="true"
			></div>
		{/if}
		<div
			class={cn(
				'absolute -inset-y-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground',
				past && 'bg-status-overdue'
			)}
			style:left={past ? '100%' : pct(elapsed)}
			aria-hidden="true"
		></div>
	</div>
{/snippet}

<!-- Small: one plain bar on the track. Its length is the days left (a full bar is 14 days or more,
     and an out-of-stock bar is full); its colour is the band. -->
{#if size === 'sm'}
	<!-- Spans (laid out as blocks) so the bar is valid inside a button, as in the queue row. -->
	<span class={cn('flex min-w-0 flex-col gap-[7px]', className)}>
		{#if showLabel}
			<span class="truncate text-ui leading-4 font-semibold num {tone}">{smallText}</span>
		{/if}
		<span
			class="block h-1.5 w-full overflow-hidden rounded-[3px] bg-track"
			role={decorative ? undefined : 'img'}
			aria-label={decorative ? undefined : smallText}
			aria-hidden={decorative || undefined}
		>
			<span
				class="block h-full rounded-[3px] transition-[width] duration-(--motion-slow) ease-motion {barColour}"
				style:width={barWidth}
			></span>
		</span>
	</span>
{:else}
	<div class={cn('flex flex-col gap-2', className)}>
		{#if showLabel}
			<p class="text-lg leading-[22px] font-semibold tracking-[-0.3px] num {tone}">{text}</p>
		{/if}
		{@render track('h-3')}
		<div class="relative h-4 text-xs text-muted-foreground num">
			<span class="absolute left-0">{formatDate(orderDate, locale, 'short')}</span>
			<span class="absolute -translate-x-1/2" style:left={soonEnd}>
				{formatDate(addDays(orderDate, daysSupply), locale, 'short')}
			</span>
		</div>
		<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
			{#each legend as [swatch, name] (swatch)}
				<li class="flex items-center gap-1.5">
					<span class="size-2 rounded-[1px] {swatch}" aria-hidden="true"></span>
					{name}
				</li>
			{/each}
		</ul>
	</div>
{/if}

<style>
	.supply-weeks {
		background-image: linear-gradient(
			to right,
			color-mix(in oklch, var(--card) 85%, transparent) 0 1px,
			transparent 1px
		);
		background-repeat: repeat-x;
	}
</style>
