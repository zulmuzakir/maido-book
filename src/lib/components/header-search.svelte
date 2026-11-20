<script lang="ts">
	import { tick } from 'svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import XIcon from '@lucide/svelte/icons/x';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		value = $bindable(''),
		id,
		name,
		label,
		placeholder,
		oninput
	}: {
		value?: string;
		id: string;
		name?: string;
		label: string;
		placeholder: string;
		oninput?: (value: string) => void;
	} = $props();

	let open = $state(false);
	let inputEl = $state<HTMLInputElement>();
	// Below md the field collapses to an icon until opened, or stays open while a query is set.
	const expanded = $derived(open || value !== '');

	async function focus() {
		open = true;
		await tick();
		inputEl?.focus();
	}

	// "/" focuses the search unless the user is already typing somewhere.
	function onkeydown(e: KeyboardEvent) {
		if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
		const t = e.target;
		if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable]')) return;
		e.preventDefault();
		void focus();
	}

	// Escape closes an empty field; a non-empty one is cleared by the browser.
	function onfieldkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && !value) open = false;
	}
</script>

<svelte:window {onkeydown} />

<div
	class={cn(
		'flex w-full items-center gap-2 md:w-auto',
		expanded &&
			'max-md:absolute max-md:inset-x-0 max-md:top-full max-md:z-20 max-md:bg-card max-md:px-4 max-md:pb-3'
	)}
>
	{#if !expanded}
		<button
			type="button"
			class="inline-flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-input bg-card md:hidden"
			aria-label={label}
			onclick={() => void focus()}
		>
			<SearchIcon class="size-[18px]" aria-hidden="true" />
		</button>
	{/if}
	<div
		class={cn('relative w-full items-center md:flex md:w-[220px]', expanded ? 'flex' : 'hidden')}
	>
		<SearchIcon
			class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
			aria-hidden="true"
		/>
		<input
			type="search"
			{id}
			{name}
			bind:this={inputEl}
			bind:value
			aria-label={label}
			{placeholder}
			autocomplete="off"
			oninput={() => oninput?.(value)}
			onkeydown={onfieldkeydown}
			onblur={() => {
				if (!value) open = false;
			}}
			class="h-11 w-full rounded-lg border border-input bg-card pr-8 pl-9 text-base placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring desk:h-10 desk:text-ui"
		/>
		{#if value}
			<button
				type="button"
				class="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground"
				aria-label={m.close()}
				onclick={() => {
					value = '';
					oninput?.('');
				}}
			>
				<XIcon class="size-4" aria-hidden="true" />
			</button>
		{:else}
			<kbd
				class="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 rounded-[4px] border border-rule px-1.5 py-px text-xs font-semibold text-ink lg:block"
				aria-hidden="true">/</kbd
			>
		{/if}
	</div>
</div>
