<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children, note }: { children: Snippet; note?: Snippet } = $props();
</script>

<!-- Pass the primary action first: it stays the form's default (Enter) button, and row-reverse
     shows it last, on the right, as the design orders them.
     Phone: a bar pinned just above the bottom nav, primary ~1.6× the secondary's width.
     Tablet: a sticky bar at the bottom of the form. Desktop: inline, right-aligned. -->
<!-- `note` sits above the buttons on phone and to their left from md (an error summary, or the
     tablet's "what happens on save" line); it brings its own colour and visibility. -->
<div
	class="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 flex flex-col gap-2 border-t border-rule bg-card px-4 py-2.5 shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)] md:sticky md:bottom-0 md:flex-row md:items-center md:gap-4 md:px-0 md:py-3 md:shadow-none xl:static xl:border-0 xl:bg-transparent xl:pt-2 xl:pb-0"
>
	{@render note?.()}
	<div
		class="flex flex-row-reverse gap-2 *:flex-1 *:first:not-only:flex-[1.6] md:ml-auto md:*:flex-none md:*:first:not-only:flex-none"
	>
		{@render children()}
	</div>
</div>
