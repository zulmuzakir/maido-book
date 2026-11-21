<script lang="ts">
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyGaps, supplySteps } from '#lib/domain/supply.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	type Order = { orderDate: string; daysSupply: number };

	let {
		orders,
		today,
		class: className
	}: {
		orders: Order[];
		today: string;
		class?: string;
	} = $props();

	/** The chart reads like the order list: the last few orders, not the whole history. */
	const WINDOW_ORDERS = 3;
	const HEIGHT_WIDE = 196;
	const HEIGHT_NARROW = 156;
	const NARROW_BELOW = 480;
	/** Room above the peaks for their date labels. */
	const PAD_TOP = 22;
	const PAD_LEFT = 6;
	/** Room on the right for the "3 hari" label of a gap that is still open. */
	const PAD_RIGHT_GAP = 44;
	const PAD_RIGHT = 8;
	const TAIL_DAYS = 2;
	const MIN_LABEL_GAP = 46;
	const MS_PER_DAY = 86_400_000;

	const epoch = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / MS_PER_DAY;

	let width = $state(0);
	const narrow = $derived(width > 0 && width < NARROW_BELOW);
	const height = $derived(narrow ? HEIGHT_NARROW : HEIGHT_WIDE);
	const locale = $derived(getLocale());
	const todayDay = $derived(epoch(today));

	const allSteps = $derived(supplySteps(orders));
	const steps = $derived(allSteps.slice(-WINDOW_ORDERS));
	const last = $derived(steps.at(-1));
	const xStart = $derived(steps.length ? steps[0].day : todayDay);
	const xEnd = $derived(
		last ? Math.max(todayDay, last.day + last.after + TAIL_DAYS) : todayDay + TAIL_DAYS
	);
	const gaps = $derived(supplyGaps(allSteps, today).filter((g) => g.end > xStart));
	const openGap = $derived(gaps.find((g) => g.ongoing) ?? null);

	const plotLeft = PAD_LEFT;
	const plotRight = $derived(width - (openGap && !narrow ? PAD_RIGHT_GAP : PAD_RIGHT));
	const base = $derived(height - 2);
	const yTop = $derived(Math.max(1, ...steps.map((s) => s.after)));
	const X = (day: number) => plotLeft + ((day - xStart) / (xEnd - xStart)) * (plotRight - plotLeft);
	const Y = (v: number) => base - (Math.max(0, v) / yTop) * (base - PAD_TOP);
	const gridYs = $derived([PAD_TOP, (PAD_TOP + base) / 2, base]);

	/** Stock falls one a day from `level` on `from`; it rests on the baseline once it runs out. */
	function decline(from: number, level: number, to: number): string {
		const out = from + level;
		return out < to ? `L${X(out)} ${base}L${X(to)} ${base}` : `L${X(to)} ${Y(level - (to - from))}`;
	}

	const lineD = $derived.by(() => {
		let d = '';
		steps.forEach((s, i) => {
			d +=
				i === 0
					? `M${X(s.day)} ${Y(s.before)}`
					: decline(steps[i - 1].day, steps[i - 1].after, s.day);
			d += `L${X(s.day)} ${Y(s.after)}`;
		});
		if (last) d += decline(last.day, last.after, xEnd);
		return d;
	});
	const areaD = $derived(lineD && `${lineD}L${X(xEnd)} ${base}L${X(xStart)} ${base}Z`);

	/** Peak labels, dropping one that would run into the next. */
	const peakLabels = $derived(
		steps
			.map((s, i) => ({ s, x: X(s.day), next: steps[i + 1] ? X(steps[i + 1].day) : Infinity }))
			.filter((p) => p.next - p.x >= MIN_LABEL_GAP)
			.map((p) => ({
				key: p.s.iso,
				x: Math.min(Math.max(p.x, 22), width - 22),
				label: formatDate(p.s.iso, locale, 'short')
			}))
	);

	const monthFmt = $derived(
		new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
			month: 'short',
			timeZone: 'UTC'
		})
	);
	const monthLabel = (d: Date) => {
		const short = monthFmt.format(d);
		return d.getUTCMonth() === 0 ? `${short} ${d.getUTCFullYear()}` : short;
	};
	/** The first month at the left edge, then each month start that fits. */
	const monthTicks = $derived.by(() => {
		const start = new Date(xStart * MS_PER_DAY);
		const out = [{ day: xStart, x: plotLeft, label: monthLabel(start) }];
		let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
		while (cursor / MS_PER_DAY <= xEnd) {
			const d = new Date(cursor);
			const x = X(cursor / MS_PER_DAY);
			if (x - out[out.length - 1].x >= 40)
				out.push({ day: cursor / MS_PER_DAY, x, label: monthLabel(d) });
			else if (out.length === 1) out[0] = { day: cursor / MS_PER_DAY, x, label: monthLabel(d) };
			cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
		}
		return out;
	});

	const nowLevel = $derived(last ? last.after - (todayDay - last.day) : 0);
	const stateText = $derived(
		nowLevel > 0
			? m.gauge_days_left({ count: Math.round(nowLevel) })
			: nowLevel === 0
				? m.gauge_out_today()
				: m.gauge_out_ago({ count: Math.round(-nowLevel) })
	);
	const todayX = $derived(X(todayDay));
</script>

<!-- Sawtooth of the last three orders: each peak is dated, stock falls a day at a time, and the
     days without stock are a thick red stretch of baseline labelled with their length. -->
<div class={cn('flex flex-col', className)}>
	<div bind:clientWidth={width} class="relative w-full" style:height="{height}px">
		{#if width > 0 && steps.length}
			<svg
				role="img"
				aria-label={m.supply_chart_aria({ state: stateText })}
				{width}
				{height}
				viewBox="0 0 {width} {height}"
				class="block animate-reveal-x overflow-visible"
			>
				{#each gridYs as gy (gy)}
					<line
						x1={plotLeft}
						x2={plotRight}
						y1={gy}
						y2={gy}
						class="stroke-gridline"
						stroke-width="1"
					/>
				{/each}

				<path d={areaD} class="fill-primary/12" />
				<path
					d={lineD}
					fill="none"
					class="stroke-primary"
					stroke-width="1.75"
					stroke-linejoin="round"
				/>

				{#each gaps as g (g.start)}
					{@const x1 = X(Math.max(g.start, xStart))}
					{@const x2 = X(g.end)}
					<line
						{x1}
						{x2}
						y1={base}
						y2={base}
						class="stroke-status-overdue"
						stroke-width="3.5"
						stroke-linecap="round"
					/>
					<!-- Phone reads the gaps from the legend under the chart instead. -->
					{#if !narrow}
						<text
							x={g.ongoing ? x2 + 6 : (x1 + x2) / 2}
							y={g.ongoing ? base + 4 : base - 7}
							text-anchor={g.ongoing ? 'start' : 'middle'}
							class="fill-status-overdue text-[11px] font-semibold num"
							aria-hidden="true">{m.customer_supply_gap_days({ count: g.days })}</text
						>
					{/if}
				{/each}

				{#if todayDay >= xStart}
					<line
						x1={todayX}
						x2={todayX}
						y1={PAD_TOP - 6}
						y2={base}
						class="stroke-foreground"
						stroke-width="1.25"
						stroke-dasharray="3 3"
					/>
					<text
						x={todayX}
						y={PAD_TOP - 11}
						text-anchor="end"
						class="fill-foreground text-[11.5px] font-semibold"
						aria-hidden="true">{m.due_today()}</text
					>
				{/if}

				{#each steps as s (s.iso + s.day)}
					<circle
						cx={X(s.day)}
						cy={Y(s.after)}
						r="4"
						class="fill-card stroke-primary"
						stroke-width="1.75"
					/>
				{/each}
				{#each peakLabels as p (p.key)}
					{#if Math.abs(p.x - todayX) > 60 || todayDay < xStart}
						<text
							x={p.x}
							y={PAD_TOP - 11}
							text-anchor="middle"
							class="fill-foreground text-[11.5px] font-semibold num"
							aria-hidden="true">{p.label}</text
						>
					{/if}
				{/each}
			</svg>
		{/if}
	</div>
	{#if width > 0 && steps.length}
		<div class="relative h-6" aria-hidden="true">
			{#each monthTicks as t (t.day)}
				<span
					class="absolute top-1.5 text-xs leading-4 whitespace-nowrap text-chart-axis num"
					style:left="{t.x}px">{t.label}</span
				>
			{/each}
		</div>
	{/if}
</div>
