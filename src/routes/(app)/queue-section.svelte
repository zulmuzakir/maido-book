<script module lang="ts">
	import type { QueueRowItem } from '#lib/queue.ts';

	export type SectionId = 'overdue' | 'today' | 'waiting' | 'winback' | 'upcoming';
	export type Section = { id: SectionId; title: string; items: QueueRowItem[]; hint?: string };
	/** One tab per section, plus Semua; the week ahead shows only at the end of Semua. */
	export type Tab = 'all' | 'overdue' | 'today' | 'waiting' | 'winback';
</script>

<script lang="ts">
	import type { PageData } from './$types';
	import GroupHeader from '#lib/components/group-header.svelte';
	import QueueRow from '#lib/components/queue-row.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';

	let {
		section,
		open,
		rows,
		hiddenCount,
		ontoggle,
		onshowmore,
		today,
		rules,
		selectedId,
		onselect,
		morph = null,
		animate = true
	}: {
		section: Section;
		open: boolean;
		rows: QueueRowItem[];
		hiddenCount: number;
		ontoggle: (() => void) | undefined;
		onshowmore: () => void;
		today: string;
		rules: PageData['rules'];
		selectedId: string | null;
		onselect: (item: QueueRowItem) => void;
		/** The row taking part in the phone detail's morph, and its part (see QueueRow). */
		morph?: { id: string; mode: 'shared' | 'hidden' } | null;
		/** Off while the list is being filtered, so typing does not set every row in motion. */
		animate?: boolean;
	} = $props();

	// A row that leaves (outcome saved, message sent, snoozed) folds away and the rows below
	// close the gap, so the agent sees the customer is done.
	const duration = $derived(motionMs(DURATION.base, animate));
	// Rows that arrive later ("Lihat N lainnya", a customer moving into this section) slide in;
	// the rows the section opens with do not. Read when a row starts its transition, so no state.
	let mounted = false;
	onMount(() => {
		mounted = true;
	});
	const rowIn = (node: Element) => slide(node, { duration: mounted ? duration : 0, easing: EASE });
</script>

<section aria-labelledby="q-{section.id}">
	{#if section.hint && open}
		<p class="px-4 py-3 text-sm leading-5 text-muted-foreground md:px-6 xl:px-8">{section.hint}</p>
	{/if}
	<GroupHeader
		id="q-{section.id}"
		label={section.title}
		count={section.items.length}
		tone={section.id === 'today'
			? 'today'
			: section.id === 'overdue' || section.id === 'winback'
				? 'overdue'
				: undefined}
		expanded={open}
		{ontoggle}
	/>
	{#if open}
		{#each rows as item (item.followUpId)}
			<div
				animate:flip={{ duration, easing: EASE }}
				in:rowIn
				out:slide={{ duration, easing: EASE }}
			>
				<QueueRow
					{item}
					{today}
					{rules}
					selected={item.followUpId === selectedId}
					morph={morph?.id === item.followUpId ? morph.mode : null}
					onselect={() => onselect(item)}
				/>
			</div>
		{/each}
		{#if hiddenCount > 0}
			<button
				type="button"
				class="flex h-12 w-full items-center border-b border-row-rule pr-4 pl-[72px] text-left text-[13.5px] font-semibold text-primary-text num hover:bg-muted md:pl-[84px] xl:pl-[92px]"
				onclick={onshowmore}
			>
				{m.queue_show_more({ count: hiddenCount })}
			</button>
		{/if}
	{/if}
</section>
