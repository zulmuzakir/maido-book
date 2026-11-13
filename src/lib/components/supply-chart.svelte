<script lang="ts">
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplySteps } from '#lib/domain/supply.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	type Order = { orderDate: string; daysSupply: number };

	let {
		orders,
		today,
		leadDays,
		dueDate = null,
		class: className
	}: {
		orders: Order[];
		today: string;
		leadDays: number;
		dueDate?: string | null;
		class?: string;
	} = $props();

	const HEIGHT_WIDE = 176;
	const HEIGHT_NARROW = 126;
	const NARROW_BELOW = 480;
	const PAD_TOP = 18;
	const PAD_BOTTOM = 22;
	const MARGIN_DAYS = 7;
	const MIN_SPAN_DAYS = 14;
	const MS_PER_DAY = 86_400_000;

	const epoch = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / MS_PER_DAY;
	const clipId = `supply-zero-${Math.random().toString(36).slice(2, 8)}`;

	let width = $state(0);
	const height = $derived(width > 0 && width < NARROW_BELOW ? HEIGHT_NARROW : HEIGHT_WIDE);
	const locale = $derived(getLocale());
	const lead = $derived(Math.max(0, leadDays));
	const todayDay = $derived(epoch(today));

	const steps = $derived(supplySteps(orders));

	const nowLevel = $derived.by(() => {
		const past = steps.filter((s) => s.day <= todayDay).at(-1);
		return past ? past.after - (todayDay - past.day) : 0;
	});

	const xStart = $derived(steps.length ? steps[0].day : todayDay);
	const lastDay = $derived(steps.length ? steps[steps.length - 1].day : todayDay);
	const xEnd = $derived(
		Math.max(xStart + MIN_SPAN_DAYS, Math.max(todayDay, lastDay) + MARGIN_DAYS)
	);
	// A lapsed customer can be months "below zero"; like the KMS card's bottom band, the red strip
	// stays shallow and the line rests on it instead of dragging the whole chart down.
	const floor = $derived(-Math.max(5, lead));
	const clampV = (v: number) => Math.max(floor, v);
	const yTop = $derived.by(() => {
		const hi = Math.max(lead, ...steps.map((s) => s.after));
		return hi + Math.max(2, hi * 0.12);
	});
	const yBottom = $derived(floor);

	const plotTop = PAD_TOP;
	const plotBottom = $derived(height - PAD_BOTTOM);
	const X = (day: number) => ((day - xStart) / (xEnd - xStart)) * width;
	const Y = (v: number) =>
		plotTop + ((yTop - clampV(v)) / (yTop - yBottom)) * (plotBottom - plotTop);

	const yZero = $derived(Y(0));
	const gridYs = $derived([plotTop, (plotTop + plotBottom) / 2, plotBottom]);

	/** Falls one day per day from `level` on `from` to `to`, resting on the floor once reached. */
	function decline(from: number, level: number, to: number): string {
		const hitsFloor = from + (level - floor);
		const seg = hitsFloor < to ? `L${X(hitsFloor)} ${Y(floor)}` : '';
		return seg + `L${X(to)} ${Y(level - (to - from))}`;
	}

	const pathD = $derived.by(() => {
		let d = '';
		steps.forEach((s, i) => {
			d +=
				i === 0
					? `M${X(s.day)} ${Y(s.before)}`
					: decline(steps[i - 1].day, steps[i - 1].after, s.day);
			d += `L${X(s.day)} ${Y(s.after)}`;
		});
		if (steps.length) d += decline(lastDay, steps[steps.length - 1].after, xEnd);
		return d;
	});

	const areaD = $derived(pathD && `${pathD}L${X(xEnd)} ${plotBottom}L${X(xStart)} ${plotBottom}Z`);

	const monthFmt = $derived(
		new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
			month: 'short',
			timeZone: 'UTC'
		})
	);
	const monthTicks = $derived.by(() => {
		const out: { day: number; label: string }[] = [];
		const start = new Date(xStart * MS_PER_DAY);
		let cursor = Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1);
		while (cursor / MS_PER_DAY <= xEnd) {
			const d = new Date(cursor);
			const short = monthFmt.format(d);
			const label = d.getUTCMonth() === 0 ? `${short} ${d.getUTCFullYear()}` : short;
			out.push({ day: cursor / MS_PER_DAY, label });
			cursor = Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
		}
		return out;
	});
	const labelEvery = $derived(
		Math.max(1, Math.ceil(monthTicks.length / Math.max(1, Math.floor(width / 64))))
	);

	const dueDay = $derived(dueDate ? epoch(dueDate) : null);

	const stateText = $derived(
		nowLevel > 0
			? m.gauge_days_left({ count: Math.round(nowLevel) })
			: nowLevel === 0
				? m.gauge_out_today()
				: m.gauge_out_ago({ count: Math.round(-nowLevel) })
	);
</script>

<div class={cn('flex flex-col', className)}>
	<div bind:clientWidth={width} class="relative w-full" style:height="{height}px">
		{#if width > 0 && steps.length}
			<svg
				role="img"
				aria-label={m.supply_chart_aria({ state: stateText })}
				{width}
				{height}
				viewBox="0 0 {width} {height}"
				class="block overflow-visible"
			>
				<defs>
					<clipPath id={clipId}>
						<rect x="0" y={yZero} {width} height={Math.max(0, plotBottom - yZero)} />
					</clipPath>
				</defs>

				{#each gridYs as gy (gy)}
					<line x1="0" x2={width} y1={gy} y2={gy} class="stroke-gridline" stroke-width="1" />
				{/each}

				<path d={areaD} class="fill-primary/8" />

				<path
					d={pathD}
					fill="none"
					class="stroke-status-overdue"
					stroke-width="5"
					clip-path="url(#{clipId})"
				/>

				<path
					d={pathD}
					fill="none"
					class="stroke-primary"
					stroke-width="2.5"
					stroke-linejoin="round"
				/>

				{#each steps as s (s.iso + s.day + s.after)}
					<circle
						cx={X(s.day)}
						cy={Y(s.after)}
						r="3.5"
						class="fill-card stroke-primary"
						stroke-width="2"
					>
						<title>{formatDate(s.iso, locale, 'short')}</title>
					</circle>
				{/each}

				{#if dueDate && dueDay !== null && dueDay >= xStart && dueDay <= xEnd}
					<line
						x1={X(dueDay)}
						x2={X(dueDay)}
						y1={plotBottom - 8}
						y2={plotBottom}
						class="stroke-foreground"
						stroke-width="2"
					>
						<title>{`${m.gauge_contact()}: ${formatDate(dueDate, locale, 'short')}`}</title>
					</line>
				{/if}

				{#if todayDay >= xStart}
					<line
						x1={X(todayDay)}
						x2={X(todayDay)}
						y1={plotTop - 6}
						y2={plotBottom}
						class="stroke-foreground"
						stroke-width="1.5"
						stroke-dasharray="3 3"
					/>
				{/if}
			</svg>
		{/if}
	</div>
	{#if width > 0 && steps.length}
		<div class="relative h-6">
			{#each monthTicks as t, i (t.day)}
				{#if i % labelEvery === 0}
					<span
						class="absolute top-1.5 text-xs leading-4 whitespace-nowrap text-chart-axis num"
						style:left="{X(t.day) + 4}px">{t.label}</span
					>
				{/if}
			{/each}
		</div>
	{/if}
</div>
