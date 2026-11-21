<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';

	/**
	 * A button's label that turns into a spinner while its form is saving. Both share one grid cell,
	 * so the button keeps its width. The swap waits 150ms (like the nav bar), so a fast save never
	 * flashes. The label only turns transparent, so the button keeps its accessible name; pair it
	 * with `aria-busy` on the button.
	 */
	let {
		busy,
		children,
		class: className
	}: { busy: boolean; children: Snippet; class?: string } = $props();
</script>

<span class={cn('inline-grid place-items-center gap-[inherit]', className)}>
	<span
		class={cn(
			'col-start-1 row-start-1 inline-flex items-center gap-[inherit]',
			busy && 'opacity-0 transition-opacity delay-150 duration-0'
		)}
	>
		{@render children()}
	</span>
	{#if busy}
		<Spinner
			aria-hidden="true"
			class="col-start-1 row-start-1 animate-in delay-150 duration-(--motion-fast) fade-in-0 fill-mode-backwards"
		/>
	{/if}
</span>
