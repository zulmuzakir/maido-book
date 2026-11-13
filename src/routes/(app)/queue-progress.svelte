<script lang="ts">
	import { m } from '#lib/paraglide/messages.js';

	let { sent, total }: { sent: number; total: number } = $props();

	const progress = $derived(total > 0 ? sent / total : 0);
</script>

<div class="flex items-center gap-2 pb-2.5 text-xs text-muted-foreground num md:shrink-0 md:pb-0">
	<div
		class="h-1 w-[140px] overflow-hidden rounded-[4px] bg-rule md:w-14 lg:w-[110px]"
		role="progressbar"
		aria-valuemin={0}
		aria-valuemax={total}
		aria-valuenow={sent}
		aria-label={m.queue_progress({ sent, total })}
	>
		<div
			class="h-full bg-primary transition-[width] duration-500 ease-out"
			style:width="{progress * 100}%"
		></div>
	</div>
	<span>{m.queue_progress({ sent, total })}</span>
</div>
