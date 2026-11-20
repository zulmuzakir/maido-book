<script lang="ts">
	import type { PageProps } from './$types';
	import QueueDone from './queue-done.svelte';
	import QueueHandled from './queue-handled.svelte';
	import QueueProgress from './queue-progress.svelte';
	import QueueSection, { type Section, type Tab } from './queue-section.svelte';
	import { untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import TextAlignStartIcon from '@lucide/svelte/icons/text-align-start';
	import InboxIcon from '@lucide/svelte/icons/inbox';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import EmptyState from '#lib/components/empty-state.svelte';
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import FollowUpCard from '#lib/components/follow-up-card.svelte';
	import HeaderSearch from '#lib/components/header-search.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { searchDigits } from '#lib/domain/phone.ts';
	import { dueState, type QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let { data }: PageProps = $props();

	const wide = new MediaQuery('(min-width: 1024px)');
	const tablet = new MediaQuery('(min-width: 768px)');
	const tabletRow = $derived(tablet.current && !wide.current);

	// Win-back customers lapsed long ago; they are worth a message but must not bury today's work.
	const isWinback = (i: QueueRowItem) => i.kind === 'winback';
	// A message with no reply after the retry window is work again: it joins the overdue list
	// instead of hiding under "Menunggu balasan" while the day reads as done.
	const isStale = (i: QueueRowItem) => dueState(i, data.today, data.rules).stale;
	const overdue = $derived([
		...data.overdue.filter((i) => !isWinback(i)),
		...data.waiting.filter(isStale)
	]);
	const dueToday = $derived(data.dueToday.filter((i) => !isWinback(i)));
	const waiting = $derived(data.waiting.filter((i) => !isStale(i)));
	const winback = $derived([...data.overdue, ...data.dueToday].filter(isWinback));
	const workCount = $derived(overdue.length + dueToday.length);
	// Before the first import or customer there is no day to finish: the queue shows how to start.
	const firstRun = $derived(!data.hasCustomers);
	// The day is done when nobody is left to contact, even if fresh replies are still pending.
	const dayDone = $derived(!firstRun && workCount === 0);

	let tab = $state<Tab>('all');
	// One tab per section. The week ahead has no tab: it only closes the "Semua" list.
	const tabItems = $derived([
		{
			key: 'all',
			label: m.customers_filter_all(),
			count: workCount + waiting.length + winback.length
		},
		{ key: 'overdue', label: m.bucket_overdue(), count: overdue.length },
		{ key: 'today', label: m.bucket_today(), count: dueToday.length },
		{ key: 'waiting', label: m.bucket_waiting(), count: waiting.length },
		{ key: 'winback', label: m.bucket_winback(), count: winback.length }
	]);

	let query = $state('');
	const matches = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return () => true;
		const digits = searchDigits(q);
		return (i: QueueRowItem) =>
			i.customer.name.toLowerCase().includes(q) || (!!digits && i.customer.phone.includes(digits));
	});

	const allSections = $derived(
		(
			[
				{ id: 'overdue', title: m.bucket_overdue(), items: overdue },
				{ id: 'today', title: m.bucket_today(), items: dueToday },
				{ id: 'waiting', title: m.bucket_waiting(), items: waiting },
				{
					id: 'winback',
					title: m.bucket_winback(),
					items: winback,
					hint: m.queue_winback_hint()
				},
				{ id: 'upcoming', title: m.bucket_upcoming(), items: data.upcoming }
			] as Section[]
		).filter((s) => s.items.length > 0)
	);
	const sections = $derived(
		allSections
			.map((s) => ({ ...s, items: s.items.filter(matches) }))
			.filter((s) => s.items.length > 0)
	);
	const shown = $derived.by(() => {
		if (tab === 'all') return sections;
		return sections.filter((s) => s.id === tab);
	});

	// Only "Selesai hari ini" folds; the open sections always show.
	let handledFolded = $state<boolean | null>(null);

	// In "Semua" every section shows its first three rows, then "Lihat N lainnya". A single tab
	// shows its whole list.
	const COLLAPSED_ROWS = 3;
	const collapses = (s: Section) => tab === 'all' && !expanded[s.id];
	let expanded = $state<Record<string, boolean>>({});
	const visibleRows = (s: Section) => (collapses(s) ? s.items.slice(0, COLLAPSED_ROWS) : s.items);
	const hiddenRows = (s: Section) =>
		collapses(s) ? Math.max(0, s.items.length - COLLAPSED_ROWS) : 0;

	// Done counts every customer who left today's work, by message, outcome, snooze or order.
	const total = $derived(data.doneToday + workCount);

	// Selection follows the list order, including rows behind "Lihat N lainnya": stepping must never
	// skip a customer. When the selected follow-up is closed, or snoozed out of the open sections, it
	// leaves the list and the card moves on to whoever now sits in its place.
	const flat = $derived(shown.flatMap((s) => s.items));
	const pool = $derived(allSections.flatMap((s) => s.items));
	let selectedId = $state<string | null>(null);
	let lastIndex = 0;
	// A send moves the customer to the end of "Menunggu balasan", far from where the agent was
	// working. Stepping then continues from the neighbours they had in the list when it was sent.
	let sentFrom = $state<{ id: string; prev: string | null; next: string | null } | null>(null);
	let sheetOpen = $state(false);
	const selected = $derived(pool.find((i) => i.followUpId === selectedId) ?? null);
	const position = $derived(selected ? flat.indexOf(selected) : -1);
	const displayed = $derived(selected);
	const sentHere = $derived(sentFrom && sentFrom.id === selectedId ? sentFrom : null);
	const inFlat = (id: string | null) => !!id && flat.some((i) => i.followUpId === id);
	const canPrev = $derived(
		sentHere ? inFlat(sentHere.prev) : position >= 0 ? position > 0 : lastIndex > 0
	);
	const canNext = $derived(
		sentHere
			? inFlat(sentHere.next)
			: position >= 0
				? position < flat.length - 1
				: lastIndex < flat.length
	);
	// "Terlambat · 3 dari 13": the place within the section the user is looking at.
	const place = $derived.by(() => {
		const section = selected ? sections.find((s) => s.items.includes(selected)) : undefined;
		return {
			section: section?.title ?? '',
			n: section && selected ? section.items.indexOf(selected) + 1 : 0,
			total: section?.items.length ?? 0
		};
	});

	// Phone: the detail is a full-screen view at `/?item=<id>`, so the system Back closes it and
	// a link such as "Buka di antrian" can open it. The queue's load ignores the URL, so opening
	// it does not reload anything.
	const urlItem = $derived(page.url.searchParams.get('item'));
	const phoneDetail = $derived(!tablet.current && urlItem !== null && !!selected);
	const itemHref = (id: string) => `${resolve('/(app)')}?item=${encodeURIComponent(id)}`;
	// Whether the open detail has a list entry behind it in this tab's history.
	let pushed = false;

	// The selection follows `?item=`: a deep link, or Back/Forward between details.
	$effect(() => {
		const id = urlItem;
		if (!id) return;
		untrack(() => {
			const item = pool.find((i) => i.followUpId === id);
			if (!item || item.followUpId === selectedId) return;
			reveal(item);
			selectedId = item.followUpId;
			if (tablet.current && !wide.current) sheetOpen = true;
		});
	});

	function closePhone() {
		if (pushed) {
			pushed = false;
			history.back();
		} else void goto(resolve('/(app)'), { replace: true, reset: false });
	}

	function onpopstate() {
		pushed = new URL(location.href).searchParams.has('item') && pushed;
	}

	$effect(() => {
		if (selectedId && !selected) {
			// A finished day has no next follow-up to select; the summary aside takes its place.
			const next = dayDone ? undefined : flat[Math.min(lastIndex, flat.length - 1)];
			if (next) untrack(() => reveal(next));
			selectedId = next?.followUpId ?? null;
			if (!next) sheetOpen = false;
		} else if (!selectedId && wide.current && tab === 'all' && !dayDone && flat.length > 0) {
			// Only "Semua" opens on its first customer; a single tab waits for a pick.
			selectedId = flat[0].followUpId;
		}
	});

	/** Unfolds the rest of a section when the selection lands on one of its hidden rows. */
	function reveal(item: QueueRowItem) {
		const section = sections.find((s) => s.items.includes(item));
		if (section && hiddenRows(section) > 0 && section.items.indexOf(item) >= COLLAPSED_ROWS) {
			expanded = { ...expanded, [section.id]: true };
		}
	}

	function select(item: QueueRowItem) {
		reveal(item);
		sentFrom = null;
		selectedId = item.followUpId;
		lastIndex = Math.max(0, flat.indexOf(item));
		if (wide.current) return;
		if (tablet.current) {
			sheetOpen = true;
			return;
		}
		// Stepping inside the open phone detail replaces the entry, so Back still means "list".
		const replace = urlItem !== null;
		if (!replace) pushed = true;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- itemHref() wraps resolve()
		void goto(itemHref(item.followUpId), { replace, reset: false });
	}

	function step(by: 1 | -1) {
		if (sentHere) {
			const id = by > 0 ? sentHere.next : sentHere.prev;
			const target = flat.find((i) => i.followUpId === id);
			if (target) select(target);
			return;
		}
		// Once the follow-up has left the list, step from the slot it occupied.
		const next = position >= 0 ? flat[position + by] : flat[lastIndex + (by > 0 ? 0 : -1)];
		if (next) select(next);
	}

	/** Called before the reload that moves the customer to "Menunggu balasan". */
	function cardSent() {
		if (!selectedId || position < 0) return;
		sentFrom = {
			id: selectedId,
			prev: flat[position - 1]?.followUpId ?? null,
			next: flat[position + 1]?.followUpId ?? null
		};
	}

	// A saved outcome takes the customer out of the list: on desktop the panel moves to whoever
	// takes their place; on tablet and phone the detail closes. The toast carries the undo.
	function outcomeSaved() {
		if (wide.current) return;
		sheetOpen = false;
		if (phoneDetail) closePhone();
	}

	// Keyboard: on desk j / k step through the queue like a mail client. Ignored while typing.
	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || !wide.current) return;
		const t = e.target;
		if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable]')) return;
		// A dialog on top owns the keyboard; the queue underneath must not move.
		if (document.querySelector('[role="alertdialog"], [role="dialog"]')) return;
		if (e.key === 'j') step(1);
		else if (e.key === 'k') step(-1);
	}
</script>

<svelte:window {onkeydown} {onpopstate} />

{#snippet search()}
	<HeaderSearch
		id="queue-search"
		bind:value={query}
		label={m.queue_search_label()}
		placeholder={m.customers_search_placeholder()}
	/>
{/snippet}

{#snippet actions()}
	<a href={resolve('/(app)/orders/new')} class={buttonVariants({ class: 'max-md:hidden' })}>
		<PlusIcon aria-hidden="true" />
		{m.new_order()}
	</a>
{/snippet}

<!-- "‹ ›" for tablet and phone: 40px outlined squares. -->
{#snippet stepButtons()}
	<div class="flex shrink-0 items-center gap-2">
		<Button
			variant="outline"
			size="icon"
			class="size-10 desk:size-10"
			aria-label={m.queue_prev()}
			disabled={!canPrev}
			onclick={() => step(-1)}
		>
			<ChevronLeftIcon class="size-5" />
		</Button>
		<Button
			variant="outline"
			size="icon"
			class="size-10 desk:size-10"
			aria-label={m.queue_next()}
			disabled={!canNext}
			onclick={() => step(1)}
		>
			<ChevronRightIcon class="size-5" />
		</Button>
	</div>
{/snippet}

<!-- "Hari ini · 1 dari 5": the place within the section. After a send the customer sits in
     "Menunggu balasan"; its place there is not the agent's, so the label is left out. -->
{#snippet placeLabel(cls: string)}
	<p class="min-w-0 flex-1 truncate {cls} num">
		{position >= 0 && !sentHere ? m.queue_position(place) : ''}
	</p>
{/snippet}

<div
	class={cn('lg:grid lg:h-dvh', firstRun ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_400px]')}
>
	<div class="flex min-h-dvh flex-col bg-card lg:min-h-0 lg:overflow-y-auto">
		<!-- Search sits in the header on phones (as an icon) and from lg up; on tablets it gets its
		     own full-width row under the progress. -->
		<PageHeader
			title={m.queue_title()}
			search={tabletRow ? undefined : search}
			{actions}
			class="md:border-b-0"
		/>

		{#if !firstRun}
			<div class="flex flex-col gap-2 px-4 pb-3.5 md:px-6 xl:px-8">
				<p class="text-sm text-muted-foreground num">
					{m.queue_summary({ todo: workCount, waiting: waiting.length })}
				</p>
				{#if total > 0}
					<QueueProgress sent={data.doneToday} {total} />
				{/if}
				{#if tabletRow}
					<div class="mt-1.5">
						<HeaderSearch
							id="queue-search"
							bind:value={query}
							label={m.queue_search_label()}
							placeholder={m.customers_search_placeholder()}
							block
						/>
					</div>
				{/if}
			</div>
			<div class="px-4 pb-3 md:border-b md:border-rule md:px-6 md:pb-0 xl:px-8">
				<FilterTabs
					items={tabItems}
					active={tab}
					label={m.queue_title()}
					onselect={(key) => {
						tab = key as Tab;
						selectedId = null;
					}}
				/>
			</div>
		{/if}

		{#if firstRun}
			<EmptyState
				icon={InboxIcon}
				title={m.queue_first_run_title()}
				description={m.queue_first_run_description()}
				class="my-auto"
			>
				{#snippet actions()}
					<Button href={resolve('/(app)/import')} class="text-ui desk:h-10">
						<UploadIcon class="size-4" aria-hidden="true" />
						{m.customers_import()}
					</Button>
					<Button variant="outline" href={resolve('/(app)/orders/new')} class="text-ui desk:h-10">
						<PlusIcon class="size-4" aria-hidden="true" />
						{m.new_order()}
					</Button>
				{/snippet}
			</EmptyState>
		{/if}

		<!-- On wide screens the aside carries the day summary, so the list does not repeat it. -->
		{#if dayDone && !query && !wide.current}
			<QueueDone doneToday={data.doneToday} waitingCount={waiting.length} next={data.upcoming[0]} />
		{/if}

		{#if shown.length === 0 && (query || tab !== 'all')}
			<p class="px-5 py-10 text-sm text-muted-foreground">
				{query ? m.queue_no_match({ q: query }) : m.queue_tab_empty()}
			</p>
		{/if}

		{#each shown as section (section.id)}
			<QueueSection
				{section}
				open
				rows={visibleRows(section)}
				hiddenCount={hiddenRows(section)}
				ontoggle={undefined}
				onshowmore={() => (expanded = { ...expanded, [section.id]: true })}
				today={data.today}
				rules={data.rules}
				{selectedId}
				onselect={select}
			/>
		{/each}

		{#if tab === 'all' && data.handled.length > 0}
			{@const open = !(handledFolded ?? !dayDone)}
			<QueueHandled items={data.handled} {open} ontoggle={() => (handledFolded = open)} />
		{/if}
	</div>

	{#if wide.current && !firstRun}
		<aside
			class="flex min-h-0 flex-col overflow-hidden border-l border-rule bg-card"
			aria-label={m.queue_card_label()}
		>
			{#if displayed}
				<div class="min-h-0 flex-1 overflow-y-auto">
					<FollowUpCard
						item={displayed}
						today={data.today}
						rules={data.rules}
						onsaved={outcomeSaved}
						onsent={cardSent}
					/>
				</div>
			{:else if dayDone && !query && tab === 'all'}
				<QueueDone
					doneToday={data.doneToday}
					waitingCount={waiting.length}
					next={data.upcoming[0]}
				/>
			{:else}
				<div class="m-auto flex max-w-[260px] flex-col items-center gap-1.5 text-center">
					<span
						class="mb-2 grid size-[52px] place-items-center rounded-full bg-avatar text-avatar-foreground"
					>
						<TextAlignStartIcon class="size-[22px]" aria-hidden="true" />
					</span>
					<p class="text-[15px] leading-5 font-semibold text-foreground">
						{m.queue_select_title()}
					</p>
					<p class="text-sm leading-5 text-muted-foreground">{m.queue_select_hint()}</p>
				</div>
			{/if}
		</aside>
	{/if}
</div>

{#if tablet.current && !wide.current}
	<Drawer.Root bind:open={sheetOpen} direction="right">
		<Drawer.Content
			class="data-[vaul-drawer-direction=right]:w-[480px] data-[vaul-drawer-direction=right]:max-w-full data-[vaul-drawer-direction=right]:rounded-none data-[vaul-drawer-direction=right]:shadow-[-12px_0_40px_color-mix(in_oklch,var(--shadow-tint)_16%,transparent)] data-[vaul-drawer-direction=right]:sm:max-w-full"
		>
			<Drawer.Header
				class="flex-row items-center gap-2 border-b border-rule py-2.5 pr-6 pl-3 text-left"
			>
				<Drawer.Title class="sr-only">{displayed?.customer.name ?? ''}</Drawer.Title>
				<Drawer.Close
					class={buttonVariants({ variant: 'ghost', size: 'icon' })}
					aria-label={m.close()}
				>
					<XIcon class="size-5" />
				</Drawer.Close>
				{@render placeLabel('text-sm font-semibold')}
				{@render stepButtons()}
			</Drawer.Header>
			<div class="min-h-0 flex-1 overflow-y-auto">
				{#if displayed}
					<FollowUpCard
						item={displayed}
						today={data.today}
						rules={data.rules}
						onsaved={outcomeSaved}
						onsent={cardSent}
					/>
				{/if}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}

{#if phoneDetail && displayed}
	<!-- Full-screen above the list, below the bottom nav (which stays visible). -->
	<section
		class="fixed inset-x-0 top-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-20 flex flex-col bg-card md:hidden"
		aria-label={displayed.customer.name}
	>
		<div class="flex min-h-14 shrink-0 items-center gap-1 border-b border-rule pr-3 pl-1">
			<button
				type="button"
				class="grid size-11 shrink-0 place-items-center rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
				aria-label={m.back()}
				onclick={closePhone}
			>
				<ChevronLeftIcon class="size-[22px]" aria-hidden="true" />
			</button>
			{@render placeLabel('text-[17px] font-bold')}
			{@render stepButtons()}
		</div>
		<div class="min-h-0 flex-1 overflow-y-auto">
			<FollowUpCard
				item={displayed}
				today={data.today}
				rules={data.rules}
				onsaved={outcomeSaved}
				onsent={cardSent}
				stickySend
			/>
		</div>
	</section>
{/if}
