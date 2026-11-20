<script lang="ts">
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { cn } from '#lib/utils.js';

	let {
		message,
		id,
		class: className
	}: {
		message?: string | null;
		id?: string;
		class?: string;
	} = $props();
</script>

{#if message}
	<p {id} class={cn('flex items-start gap-1.5 text-ui leading-[18px] text-destructive', className)}>
		<TriangleAlertIcon class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
		<span>{message}</span>
	</p>
{/if}
