<script lang="ts">
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import { resolve } from '$app/paths';
	import GroupHeader from '#lib/components/group-header.svelte';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import { outcomeLabel } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageData } from './$types';

	let {
		items,
		open,
		ontoggle
	}: {
		items: PageData['handled'];
		open: boolean;
		ontoggle: () => void;
	} = $props();

	const TONE: Record<PageData['handled'][number]['outcome'], string> = {
		ordered: 'text-status-done',
		replied: 'text-primary-text',
		interested: 'text-primary-text',
		no_reply: 'text-muted-foreground',
		not_interested: 'text-muted-foreground'
	};
</script>

<section aria-labelledby="q-handled">
	<GroupHeader
		id="q-handled"
		label={m.queue_done_contacted_today()}
		count={items.length}
		expanded={open}
		{ontoggle}
		class="gap-2 px-4 md:px-5"
	>
		{#snippet icon()}
			<CircleCheckIcon class="size-3.5 text-status-done" aria-hidden="true" />
		{/snippet}
	</GroupHeader>
	{#if open}
		<ul>
			{#each items as h (h.id)}
				<li class="border-b border-row-rule px-4 py-2.5 md:px-5">
					<PersonSummary
						name={h.name}
						href={resolve('/(app)/customers/[id]', { id: h.customerId })}
						nameClass="truncate text-sm font-semibold hover:underline"
					>
						<span class="text-ui {TONE[h.outcome]}">{outcomeLabel(h.outcome)}</span>
					</PersonSummary>
				</li>
			{/each}
		</ul>
	{/if}
</section>
