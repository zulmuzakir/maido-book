<script lang="ts">
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
	<p {id} class={cn('text-ui text-destructive', className)}>{message}</p>
{/if}
