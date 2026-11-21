<script lang="ts">
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { resolve } from '$app/paths';
	import GroupHeader from '#lib/components/group-header.svelte';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import type { HandledOutcome } from '#lib/domain/handled.ts';
	import { outcomeLabel } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { cn } from '#lib/utils.js';
	import { slide } from 'svelte/transition';
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

	const locale = $derived(getLocale());
	const CAP = 5;
	let showAll = $state(false);
	const rows = $derived(showAll ? items : items.slice(0, CAP));

	const label = (o: HandledOutcome) =>
		o === 'contacted' ? m.today_waiting_today() : outcomeLabel(o);
	// A reply is news; an order, a plain send or a no is settled.
	const tone = (o: HandledOutcome) =>
		o === 'replied' || o === 'interested' ? 'text-foreground' : 'text-muted-foreground';
	const KIND: Record<HandledOutcome, () => string> = {
		ordered: m.handled_kind_ordered,
		replied: m.handled_kind_replied,
		interested: m.handled_kind_interested,
		no_reply: m.handled_kind_no_reply,
		not_interested: m.handled_kind_not_interested,
		contacted: m.handled_kind_contacted
	};
	// "2 · membalas, dihubungi": the kinds of result, in order of first appearance.
	const kinds = $derived(
		[...new Set(items.map((h) => h.outcome))].map((o) => KIND[o]()).join(', ')
	);
</script>

{#if !open}
	<button
		type="button"
		id="q-handled"
		class="flex h-[52px] w-full items-center gap-2 border-b border-row-rule px-4 text-left text-[13.5px] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset md:px-6 xl:px-8"
		aria-expanded="false"
		onclick={ontoggle}
	>
		<ChevronDownIcon class="size-4 -rotate-90" aria-hidden="true" />
		<b class="font-semibold text-foreground">{m.queue_done_contacted_today()}</b>
		<span class="truncate num">{items.length} · {kinds}</span>
	</button>
{:else}
	<section
		aria-labelledby="q-handled"
		in:slide={{ duration: motionMs(DURATION.base), easing: EASE }}
	>
		<GroupHeader
			id="q-handled"
			label={m.queue_handled_open()}
			count={items.length}
			expanded
			{ontoggle}
		/>
		<ul>
			{#each rows as h (h.id)}
				{@const qty = h.lastOrder
					? m.queue_row_qty({ qty: h.lastOrder.qty, unit: h.lastOrder.unitLabel })
					: ''}
				<li class="border-b border-row-rule">
					<a
						href={resolve('/(app)/customers/[id]', { id: h.customerId })}
						class="grid min-h-20 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 px-4 py-2.5 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset md:min-h-[72px] md:grid-cols-[44px_minmax(0,1fr)_150px_100px] md:gap-x-4 md:px-6 md:py-0 xl:grid-cols-[44px_minmax(0,1fr)_150px_160px_100px] xl:px-8"
					>
						<InitialsAvatar
							name={h.name}
							size={44}
							class="bg-avatar text-base font-extrabold text-avatar-foreground"
						/>
						<div class="flex min-w-0 flex-col gap-[5px] md:gap-[3px]">
							<p class="truncate text-[15px] leading-[18px] font-semibold">{h.name}</p>
							<p class="truncate text-[12.5px] leading-4 text-muted-foreground num md:text-ui">
								{#if h.lastOrder}
									{m.queue_row_order({
										date: formatDate(h.lastOrder.orderDate, locale, 'short')
									})}<span class="xl:hidden">&nbsp;· {qty}</span>
								{:else}
									{m.queue_no_order()}
								{/if}
							</p>
							<p class={cn('text-ui font-semibold md:hidden', tone(h.outcome))}>
								{label(h.outcome)}
							</p>
						</div>
						<span class="hidden truncate text-ui text-muted-foreground num xl:block">{qty}</span>
						<span class={cn('hidden truncate text-ui font-semibold md:block', tone(h.outcome))}
							>{label(h.outcome)}</span
						>
						<span class="hidden md:block" aria-hidden="true"></span>
					</a>
				</li>
			{/each}
		</ul>
		{#if items.length > rows.length}
			<button
				type="button"
				class="flex h-12 w-full items-center border-b border-row-rule pr-4 pl-[72px] text-left text-[13.5px] font-semibold text-primary-text num hover:bg-muted md:pl-[84px] xl:pl-[92px]"
				onclick={() => (showAll = true)}
			>
				{m.queue_show_more({ count: items.length - rows.length })}
			</button>
		{/if}
	</section>
{/if}
