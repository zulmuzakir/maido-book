<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let {
		days,
		today
	}: {
		days: { date: string; revenue: number }[];
		today: string;
	} = $props();

	const max = $derived(Math.max(1, ...days.map((d) => d.revenue)));
	const dayNumber = (iso: string) => Number(iso.slice(8));
	const showLabel = (iso: string, i: number) =>
		days.length <= 12 ||
		iso === today ||
		i === 0 ||
		i === days.length - 1 ||
		dayNumber(iso) % 5 === 0;
</script>

<div class="flex flex-col xl:w-[720px]" role="img" aria-label={m.insights_daily_title()}>
	<svg
		viewBox="0 0 {days.length} 100"
		preserveAspectRatio="none"
		class="h-[106px] w-full md:h-[156px]"
		aria-hidden="true"
	>
		{#each [0.5, 50, 99.5] as y (y)}
			<line
				x1="0"
				x2={days.length}
				y1={y}
				y2={y}
				class="stroke-gridline"
				stroke-width="1"
				vector-effect="non-scaling-stroke"
			/>
		{/each}
		{#each days as d, i (d.date)}
			{@const h = (d.revenue / max) * 100}
			<rect
				x={i + 0.2}
				y={100 - h}
				width="0.6"
				height={h}
				rx="0.2"
				class={d.date === today ? 'fill-primary' : 'fill-chart-bar'}
			/>
		{/each}
	</svg>
	<div class="flex h-6 items-center pl-[34px]" aria-hidden="true">
		{#each days as d, i (d.date)}
			<span
				class="flex-1 text-center text-xs {d.date === today
					? 'font-bold text-ink'
					: 'font-medium text-chart-axis'}"
			>
				{showLabel(d.date, i) ? dayNumber(d.date) : ''}
			</span>
		{/each}
	</div>
</div>
