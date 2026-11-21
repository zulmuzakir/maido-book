<script lang="ts">
	import { formatRupiah } from '#lib/format.ts';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { Tween } from 'svelte/motion';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let {
		days,
		today
	}: {
		days: { date: string; revenue: number }[];
		today: string;
	} = $props();

	// Drawn in pixels at the measured width: a y axis in Rp juta (three steps of a round size),
	// bars up to 40px wide with a 4px top radius, and today's value printed above its bar.
	let width = $state(0);
	const AXIS = 30;
	const TOP = 22;
	const BOTTOM = 26;
	const STEPS = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];

	const millions = $derived(days.map((d) => d.revenue / 1_000_000));
	// The bars grow from the baseline on load and move to the new values when the month changes.
	// Months differ in length, so a day the previous month did not have starts from 0.
	const bars = new Tween<number[]>([], {
		easing: EASE,
		interpolate: (a, b) => (t) => b.map((v, i) => (a[i] ?? 0) + (v - (a[i] ?? 0)) * t)
	});
	$effect(() => {
		void bars.set(millions, { duration: motionMs(DURATION.slow) });
	});
	const step = $derived(STEPS.find((s) => s * 3 >= Math.max(...millions, 0)) ?? 1000);
	const top = $derived(step * 3);
	const fmt = $derived(
		new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-GB', { maximumFractionDigits: 2 })
	);

	const tall = $derived(width < 480 ? 190 : 230);
	const base = $derived(tall - BOTTOM);
	const plot = $derived(base - TOP);
	// 8px on the right keeps the last day's label and today's value inside the frame.
	const slot = $derived(days.length ? (width - AXIS - 8) / days.length : 0);
	const bar = $derived(Math.max(4, Math.min(40, slot * 0.55)));
	const y = (v: number) => base - (v / top) * plot;
	const dayNumber = (iso: string) => Number(iso.slice(8));
	// Narrow: label the first and last days, today, and every fifth day, but drop a fifth day that
	// sits next to one of the others ("20" and "21" would run together as "2021").
	const anchors = $derived(
		[0, days.length - 1, days.findIndex((d) => d.date === today)].filter((i) => i >= 0)
	);
	// The bars are hidden from screen readers; this sentence carries the numbers instead.
	const summary = $derived.by(() => {
		const total = days.reduce((sum, d) => sum + d.revenue, 0);
		if (total === 0) return m.insights_daily_title();
		const best = days.reduce((a, b) => (b.revenue > a.revenue ? b : a));
		return m.insights_daily_aria({
			title: m.insights_daily_title(),
			total: formatRupiah(total),
			max: formatRupiah(best.revenue),
			day: dayNumber(best.date)
		});
	});
	const showLabel = (iso: string, i: number) =>
		slot >= 22 ||
		anchors.includes(i) ||
		(dayNumber(iso) % 5 === 0 && anchors.every((a) => Math.abs(a - i) >= 2));
</script>

<div bind:clientWidth={width} class="w-full" role="img" aria-label={summary}>
	{#if width > 0}
		<svg {width} height={tall} viewBox="0 0 {width} {tall}" class="block" aria-hidden="true">
			{#each [0, 1, 2, 3] as i (i)}
				{@const ly = y(step * i)}
				<line
					x1={AXIS}
					x2={width}
					y1={ly}
					y2={ly}
					class={i === 0 ? 'stroke-border' : 'stroke-rule'}
					stroke-width="1"
				/>
				<text x={AXIS - 8} y={ly + 4} text-anchor="end" class="fill-chart-axis text-[11.5px] num"
					>{fmt.format(step * i)}</text
				>
			{/each}
			{#each days as d, i (d.date)}
				{@const cx = AXIS + slot * (i + 0.5)}
				{@const h = Math.max(0, base - y(bars.current[i] ?? 0))}
				{@const isToday = d.date === today}
				{@const r = Math.min(4, bar / 2, h)}
				{#if h > 0}
					<!-- Square at the baseline, rounded at the top. -->
					<path
						d="M{cx - bar / 2},{base} v{r - h} q0,{-r} {r},{-r} h{bar - 2 * r} q{r},0 {r},{r} v{h -
							r} z"
						class={isToday ? 'fill-primary' : 'fill-chart-bar'}
					/>
				{/if}
				{#if isToday && d.revenue > 0}
					<text
						x={Math.min(cx, width - 16)}
						y={base - h - 7}
						text-anchor="middle"
						class="fill-primary-text text-xs font-bold num">{fmt.format(millions[i])}</text
					>
				{/if}
				{#if showLabel(d.date, i)}
					<text
						x={cx}
						y={tall - 7}
						text-anchor="middle"
						class={isToday
							? 'fill-foreground text-xs font-bold num'
							: 'fill-chart-axis text-xs font-medium num'}>{dayNumber(d.date)}</text
					>
				{/if}
			{/each}
		</svg>
	{:else}
		<div class="h-[190px] min-[480px]:h-[230px]"></div>
	{/if}
</div>
