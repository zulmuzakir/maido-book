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
		onselect
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
	} = $props();
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
			<QueueRow
				{item}
				{today}
				{rules}
				selected={item.followUpId === selectedId}
				onselect={() => onselect(item)}
			/>
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
