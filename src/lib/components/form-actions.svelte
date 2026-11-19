<script lang="ts">
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();
</script>

<!-- Phones: pinned above the safe area in place of the bottom nav (formColumn leaves room for it). From md: inline, left-aligned. Primary goes first. -->
<div
	class="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-rule bg-card px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] *:flex-1 md:static md:flex-wrap md:border-0 md:bg-transparent md:p-0 md:*:flex-none"
>
	{@render children()}
</div>
