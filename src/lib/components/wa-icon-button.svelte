<script lang="ts">
	import WhatsappIcon from '#lib/components/whatsapp-icon.svelte';

	import { cn } from '#lib/utils.js';

	let {
		href,
		label,
		onclick,
		disabled = false,
		class: className
	}: {
		href: string;
		label: string;
		onclick?: () => void;
		/** While the send is being logged, a second tap neither reopens WhatsApp nor logs again. */
		disabled?: boolean;
		class?: string;
	} = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<a
	{href}
	onclick={(e) => {
		if (disabled) e.preventDefault();
		else onclick?.();
	}}
	aria-disabled={disabled || undefined}
	target="_blank"
	rel="noopener"
	aria-label={label}
	class={cn(
		'inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-input bg-card text-whatsapp-text transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:opacity-50 desk:size-9',
		className
	)}
>
	<WhatsappIcon class="size-[17px]" />
</a>
