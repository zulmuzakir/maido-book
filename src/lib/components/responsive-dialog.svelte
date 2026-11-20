<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { cn } from '#lib/utils.js';

	let {
		open = $bindable(false),
		title,
		description,
		children,
		footer,
		confirm = false
	}: {
		open?: boolean;
		title: string;
		description?: string;
		children: Snippet;
		footer?: Snippet;
		/** Phone bottom sheet for destructive confirmations: tighter body and 36px bottom padding. */
		confirm?: boolean;
	} = $props();

	const desktop = new MediaQuery('(min-width: 768px)');
	const TITLE = 'text-[18px] leading-[22px] font-bold tracking-[-0.02em]';
	const DESCRIPTION = 'text-sm leading-[21px] text-muted-foreground';
</script>

{#if desktop.current}
	<Dialog.Root bind:open>
		<!-- Centred dialog: 480px on tablet, 440px on desktop. -->
		<Dialog.Content class="sm:max-w-[480px] xl:max-w-[440px]">
			<Dialog.Header class="gap-2">
				<Dialog.Title class={TITLE}>{title}</Dialog.Title>
				{#if description}<Dialog.Description class={DESCRIPTION}>{description}</Dialog.Description
					>{/if}
			</Dialog.Header>
			{@render children()}
			{#if footer}<Dialog.Footer>{@render footer()}</Dialog.Footer>{/if}
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<Drawer.Root bind:open>
		<Drawer.Content class="data-[vaul-drawer-direction=bottom]:rounded-t-[16px]">
			<Drawer.Header
				class={cn(
					'gap-2 px-6 pt-4 text-left group-data-[vaul-drawer-direction=bottom]/drawer-content:text-left',
					confirm && 'pb-0'
				)}
			>
				<Drawer.Title class={TITLE}>{title}</Drawer.Title>
				{#if description}<Drawer.Description class={DESCRIPTION}>{description}</Drawer.Description
					>{/if}
			</Drawer.Header>
			<div class={cn('max-h-[70vh] overflow-y-auto px-6 pb-2', confirm && 'pt-2 pb-0')}>
				{@render children()}
			</div>
			<Drawer.Footer
				class={cn(
					'px-6 pb-[calc(1rem+env(safe-area-inset-bottom))]',
					confirm && 'pb-[max(2.25rem,env(safe-area-inset-bottom))]'
				)}
			>
				{#if footer}{@render footer()}{/if}
			</Drawer.Footer>
		</Drawer.Content>
	</Drawer.Root>
{/if}
