<script lang="ts">
	import type { PageProps } from './$types';
	import QueueDone from './queue-done.svelte';
	import QueueHandled from './queue-handled.svelte';
	import QueueProgress from './queue-progress.svelte';
	import QueueSection, { type Section, type SectionId, type Tab } from './queue-section.svelte';
	import { untrack } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import UsersIcon from '@lucide/svelte/icons/users';
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
	import type { SavedOutcome } from '#lib/components/follow-up-outcome.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { dueState, type QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let { data }: PageProps = $props();

	const wide = new MediaQuery('(min-width: 1024px)');
	const tablet = new MediaQuery('(min-width: 768px)');

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
	// Tabs follow the job, not the five sections: who to contact now, who owes a reply, and later.
	const TAB_SECTIONS: Record<Exclude<Tab, 'all'>, SectionId[]> = {
		todo: ['overdue', 'today'],
		waiting: ['waiting'],
		later: ['winback', 'upcoming']
	};
	const tabItems = $derived([
		// "Semua" lists every section, the week ahead included, so it carries no count of its own.
		{ key: 'all', label: m.customers_filter_all() },
		{ key: 'todo', label: m.queue_tab_todo(), count: workCount },
		{ key: 'waiting', label: m.queue_tab_waiting(), count: waiting.length },
		{ key: 'later', label: m.queue_tab_later(), count: winback.length + data.upcoming.length }
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
		const ids = TAB_SECTIONS[tab];
		return sections.filter((s) => ids.includes(s.id));
	});

	// Win-back and the week ahead stay folded while there is today's work to do. Folding only
	// applies to the grouped "all" view; a single tab always shows its whole list.
	let folded = $state<Record<string, boolean>>({});
	const isFolded = (id: SectionId) =>
		tab === 'all' && (folded[id] ?? ((id === 'winback' || id === 'upcoming') && !dayDone));

	// Overdue and today are the work and always show in full; only the lists that wait get capped.
	const COLLAPSED_ROWS = 3;
	const collapses = (s: Section) =>
		tab === 'all' && !expanded[s.id] && !TAB_SECTIONS.todo.includes(s.id);
	let expanded = $state<Record<string, boolean>>({});
	const visibleRows = (s: Section) => (collapses(s) ? s.items.slice(0, COLLAPSED_ROWS) : s.items);
	const hiddenRows = (s: Section) =>
		collapses(s) ? Math.max(0, s.items.length - COLLAPSED_ROWS) : 0;

	// Done counts every customer who left today's work, by message, outcome, snooze or order.
	const total = $derived(data.doneToday + workCount);

	// Selection follows the list order, including rows behind "Lihat N lainnya": stepping must never
	// skip a customer. When the selected follow-up is closed, or snoozed out of the open sections, it
	// leaves the list and the card moves on to whoever now sits in its place.
	const flat = $derived(shown.filter((s) => !isFolded(s.id)).flatMap((s) => s.items));
	const pool = $derived(allSections.filter((s) => !isFolded(s.id)).flatMap((s) => s.items));
	let selectedId = $state<string | null>(null);
	let saved = $state<(SavedOutcome & { item: QueueRowItem }) | null>(null);
	let lastIndex = 0;
	// A send moves the customer to the end of "Menunggu balasan", far from where the agent was
	// working. Stepping then continues from the neighbours they had in the list when it was sent.
	let sentFrom = $state<{ id: string; prev: string | null; next: string | null } | null>(null);
	let sheetOpen = $state(false);
	const selected = $derived(pool.find((i) => i.followUpId === selectedId) ?? null);
	const position = $derived(selected ? flat.indexOf(selected) : -1);
	// The customer whose outcome was just saved stays open ("Hasil tersimpan") until the user moves on.
	const savedHere = $derived(saved && saved.item.followUpId === selectedId ? saved : null);
	const displayed = $derived(selected ?? savedHere?.item ?? null);
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
	// "Terlambat · 3 dari 13": the place within the list the user is looking at, so the number does
	// not jump when a folded section is opened.
	const place = $derived.by(() => {
		const section = selected ? sections.find((s) => s.items.includes(selected)) : undefined;
		return {
			section: section?.title ?? '',
			n: section && selected ? section.items.indexOf(selected) + 1 : 0,
			total: section?.items.length ?? 0
		};
	});

	$effect(() => {
		if (selectedId && !selected) {
			// The saved follow-up has left the list but stays on screen until the user moves on.
			if (savedHere) return;
			// A finished day has no next follow-up to select; the summary aside takes its place.
			const next = dayDone ? undefined : flat[Math.min(lastIndex, flat.length - 1)];
			if (next) untrack(() => reveal(next));
			selectedId = next?.followUpId ?? null;
			if (!next) sheetOpen = false;
		} else if (!selectedId && wide.current && (tab !== 'all' || !dayDone) && flat.length > 0) {
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
		saved = null;
		sentFrom = null;
		selectedId = item.followUpId;
		lastIndex = Math.max(0, flat.indexOf(item));
		if (!wide.current) sheetOpen = true;
	}

	function step(by: 1 | -1) {
		if (sentHere) {
			const id = by > 0 ? sentHere.next : sentHere.prev;
			const target = flat.find((i) => i.followUpId === id);
			if (target) select(target);
			return;
		}
		// Once the saved follow-up has left the list, step from the slot it occupied.
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

	function outcomeSaved(result: SavedOutcome) {
		if (displayed) saved = { ...result, item: displayed };
	}

	function clearSaved() {
		saved = null;
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

<svelte:window {onkeydown} />

{#snippet meta()}
	<!-- The counts live in the progress bar and the tabs; the header only dates the day. -->
	<time class="num" datetime={data.today}>{formatDate(data.today, getLocale(), 'long')}</time>
{/snippet}

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

{#snippet stepper()}
	{#if position >= 0 || savedHere || sentHere}
		<div class="flex items-center gap-1">
			<!-- After a send the customer sits in "Menunggu balasan"; its place there is not the agent's. -->
			{#if position >= 0 && !sentHere}
				<span class="mr-1 text-ui text-muted-foreground num">
					{m.queue_position(place)}
				</span>
			{/if}
			<Button
				variant="ghost"
				size="icon"
				aria-label={m.queue_prev()}
				aria-keyshortcuts={wide.current ? 'k' : undefined}
				title={wide.current ? `${m.queue_prev()} (K)` : undefined}
				disabled={!canPrev}
				onclick={() => step(-1)}
			>
				<ChevronUpIcon />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label={m.queue_next()}
				aria-keyshortcuts={wide.current ? 'j' : undefined}
				title={wide.current ? `${m.queue_next()} (J)` : undefined}
				disabled={!canNext}
				onclick={() => step(1)}
			>
				<ChevronDownIcon />
			</Button>
		</div>
	{/if}
{/snippet}

<div
	class={cn('lg:grid lg:h-dvh', firstRun ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1fr)_400px]')}
>
	<div class="flex min-h-dvh flex-col bg-card lg:min-h-0 lg:overflow-y-auto">
		<PageHeader title={m.queue_title()} metaInline="md" {meta} {search} {actions} />

		{#if !firstRun}
			<div
				class="flex flex-col px-4 pb-3 md:h-11 md:flex-row md:items-center md:gap-5 md:border-b md:border-rule md:px-6 md:pb-0 xl:px-8"
			>
				<div class="min-w-0 flex-1">
					<FilterTabs
						items={tabItems}
						active={tab}
						label={m.queue_title()}
						onselect={(key) => {
							tab = key as Tab;
							saved = null;
							selectedId = null;
						}}
					/>
				</div>
				{#if total > 0}
					<div class="order-first md:order-last">
						<QueueProgress sent={data.doneToday} {total} />
					</div>
				{/if}
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
			{@const open = !isFolded(section.id)}
			<QueueSection
				{section}
				{open}
				rows={visibleRows(section)}
				hiddenCount={hiddenRows(section)}
				ontoggle={tab === 'all' ? () => (folded = { ...folded, [section.id]: open }) : undefined}
				onshowmore={() => (expanded = { ...expanded, [section.id]: true })}
				today={data.today}
				rules={data.rules}
				{selectedId}
				onselect={select}
			/>
		{/each}

		{#if tab === 'all' && data.handled.length > 0}
			{@const open = !(folded.handled ?? !dayDone)}
			<QueueHandled
				items={data.handled}
				{open}
				ontoggle={() => (folded = { ...folded, handled: open })}
			/>
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
						{stepper}
						saved={savedHere}
						onsaved={outcomeSaved}
						onundo={clearSaved}
						onnext={() => step(1)}
						hasNext={canNext}
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
				<div class="m-auto flex max-w-80 flex-col items-center gap-2.5 text-center">
					<span
						class="flex size-12 items-center justify-center rounded-full bg-secondary text-primary-text"
					>
						<UsersIcon class="size-5" aria-hidden="true" />
					</span>
					<p class="text-sm leading-[18px] text-muted-foreground">{m.queue_select_hint()}</p>
				</div>
			{/if}
		</aside>
	{/if}
</div>

{#if !wide.current}
	<Drawer.Root bind:open={sheetOpen} direction={tablet.current ? 'right' : 'bottom'}>
		<Drawer.Content
			class={tablet.current
				? 'data-[vaul-drawer-direction=right]:w-[430px] data-[vaul-drawer-direction=right]:max-w-full data-[vaul-drawer-direction=right]:rounded-l-[20px] data-[vaul-drawer-direction=right]:shadow-[-12px_0_40px_color-mix(in_oklch,var(--shadow-tint)_16%,transparent)] data-[vaul-drawer-direction=right]:sm:max-w-full'
				: 'max-h-[92dvh]'}
		>
			<Drawer.Header class="flex-row items-center justify-between py-2 text-left">
				<Drawer.Title class="sr-only">{displayed?.customer.name ?? ''}</Drawer.Title>
				{@render stepper()}
				{#if tablet.current}
					<Drawer.Close
						class={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'ml-auto')}
						aria-label={m.close()}
					>
						<XIcon />
					</Drawer.Close>
				{/if}
			</Drawer.Header>
			<div class="min-h-0 flex-1 overflow-y-auto pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
				{#if displayed}
					<FollowUpCard
						item={displayed}
						today={data.today}
						rules={data.rules}
						saved={savedHere}
						onsaved={outcomeSaved}
						onundo={clearSaved}
						onnext={() => step(1)}
						hasNext={canNext}
						onsent={cardSent}
					/>
				{/if}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
