<script lang="ts">
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import WhatsappIcon from '#lib/components/whatsapp-icon.svelte';

	import { cn } from '#lib/utils.js';

	let {
		href,
		label,
		text,
		filled = false,
		onclick,
		disabled = false,
		class: className
	}: {
		href: string;
		/** Accessible name: says what the tap does. */
		label: string;
		/** Visible label ("Kirim") from md up. With it the button is a green outline with a speech
		 *  bubble (the queue's send button); without it, an icon-only WhatsApp glyph. */
		text?: string;
		/** Solid green, for the selected row. */
		filled?: boolean;
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
		'inline-flex size-11 shrink-0 items-center justify-center gap-2 rounded-lg border transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring aria-disabled:opacity-45',
		text
			? filled
				? 'border-whatsapp bg-whatsapp text-whatsapp-foreground hover:bg-[color-mix(in_oklch,var(--whatsapp),var(--foreground)_18%)]'
				: 'border-whatsapp-text bg-card text-whatsapp-text hover:bg-[color-mix(in_oklch,var(--whatsapp)_8%,var(--card))]'
			: 'border-input bg-card text-whatsapp-text hover:bg-muted desk:size-10',
		text && 'md:w-[100px] md:text-sm md:font-semibold',
		className
	)}
>
	{#if text}
		<MessageCircle class="size-[18px]" aria-hidden="true" />
		<span class="hidden md:inline" aria-hidden="true">{text}</span>
	{:else}
		<WhatsappIcon class="size-[17px]" />
	{/if}
</a>
