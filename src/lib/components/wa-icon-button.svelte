<script lang="ts">
	import WhatsappIcon from '#lib/components/whatsapp-icon.svelte';

	import { cn } from '#lib/utils.js';

	let {
		href,
		label,
		onclick,
		class: className
	}: { href: string; label: string; onclick?: () => void; class?: string } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<a
	{href}
	{onclick}
	target="_blank"
	rel="noopener"
	aria-label={label}
	class={cn(
		'inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-status-done transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-accent desk:size-9',
		className
	)}
>
	<WhatsappIcon class="size-[17px]" />
</a>
