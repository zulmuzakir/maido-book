<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { sent, total }: { sent: number; total: number } = $props();

	const progress = $derived(total > 0 ? Math.min(1, sent / total) : 0);
</script>

<!-- "▬▬▭▭ 6 dari 17 dihubungi": a 96px bar, then the count with the sent number in ink. -->
<div class="flex items-center gap-2.5 text-ui whitespace-nowrap text-muted-foreground num">
	<div
		class="h-1.5 w-24 shrink-0 overflow-hidden rounded-[3px] bg-track"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={total}
		aria-valuenow={sent}
		aria-label={m.queue_progress({ sent, total })}
	>
		<div
			class="h-full rounded-[3px] bg-primary transition-[width] duration-(--motion-slow) ease-motion"
			style:width="{progress * 100}%"
		></div>
	</div>
	<span aria-hidden="true"
		><b class="font-semibold text-foreground">{sent}</b> {m.queue_progress_of({ total })}</span
	>
</div>
