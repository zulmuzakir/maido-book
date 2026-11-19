<script module lang="ts">
	import type { QueueRowItem } from '#lib/queue.ts';

	export type SectionId = 'overdue' | 'today' | 'waiting' | 'winback' | 'upcoming';
	export type Section = { id: SectionId; title: string; items: QueueRowItem[]; hint?: string };
	export type Tab = 'all' | 'todo' | 'waiting' | 'later';
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
	<GroupHeader
		id="q-{section.id}"
		label={section.title}
		count={section.items.length}
		expanded={open}
		{ontoggle}
	/>
	{#if open}
		{#if section.hint}
			<p
				class="border-b border-row-rule bg-subtle px-5 py-3.5 text-ui leading-[19px] text-subtle-foreground"
			>
				{section.hint}
			</p>
		{/if}
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
				class="flex h-11 w-full items-center pr-5 pl-[70px] text-left text-ui font-semibold text-primary-text num desk:h-10"
				onclick={onshowmore}
			>
				{m.queue_show_more({ count: hiddenCount })}
			</button>
		{/if}
	{/if}
</section>
