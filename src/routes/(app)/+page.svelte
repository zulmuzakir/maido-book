<script lang="ts">
	import type { PageProps } from './$types';
	import QueueDone from './queue-done.svelte';
	import QueueHandled from './queue-handled.svelte';
	import QueueDaySummary from './queue-day-summary.svelte';
	import QueueProgress from './queue-progress.svelte';
	import QueueSection, { type Section, type SectionId, type Tab } from './queue-section.svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import XIcon from '@lucide/svelte/icons/x';
	import UsersIcon from '@lucide/svelte/icons/users';
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import FollowUpCard from '#lib/components/follow-up-card.svelte';
	import HeaderSearch from '#lib/components/header-search.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import { Button, buttonVariants } from '#lib/components/ui/button/index.js';
	import { searchDigits } from '#lib/domain/phone.ts';
	import type { QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let { data }: PageProps = $props();

	const wide = new MediaQuery('(min-width: 1024px)');
	const tablet = new MediaQuery('(min-width: 768px)');

	// Win-back customers lapsed long ago; they are worth a message but must not bury today's work.
	const isWinback = (i: QueueRowItem) => i.kind === 'winback';
	const overdue = $derived(data.overdue.filter((i) => !isWinback(i)));
	const dueToday = $derived(data.dueToday.filter((i) => !isWinback(i)));
	const winback = $derived([...data.overdue, ...data.dueToday].filter(isWinback));
	const workCount = $derived(overdue.length + dueToday.length);
	// The day is done when nobody is left to contact, even if replies are still pending.
	const dayDone = $derived(workCount === 0);

	let tab = $state<Tab>('all');
	const tabItems = $derived([
		{
			key: 'all',
			label: m.customers_filter_all(),
			count: workCount + data.waiting.length + winback.length
		},
		{ key: 'overdue', label: m.bucket_overdue(), count: overdue.length },
		{ key: 'today', label: m.bucket_today(), count: dueToday.length },
		{ key: 'waiting', label: m.bucket_waiting(), count: data.waiting.length },
		{ key: 'winback', label: m.bucket_winback(), count: winback.length },
		{ key: 'upcoming', label: m.bucket_upcoming(), count: data.upcoming.length }
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
				{ id: 'waiting', title: m.bucket_waiting(), items: data.waiting },
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
	const shown = $derived(tab === 'all' ? sections : sections.filter((s) => s.id === tab));

	// Win-back and the week ahead stay folded while there is today's work to do. Folding only
	// applies to the grouped "all" view; a single tab always shows its whole list.
	let folded = $state<Record<string, boolean>>({});
	const isFolded = (id: SectionId) =>
		tab === 'all' && (folded[id] ?? ((id === 'winback' || id === 'upcoming') && !dayDone));

	const COLLAPSED_ROWS = 3;
	let expanded = $state<Record<string, boolean>>({});
	const visibleRows = (s: Section) =>
		tab !== 'all' || expanded[s.id] ? s.items : s.items.slice(0, COLLAPSED_ROWS);
	const hiddenRows = (s: Section) =>
		tab === 'all' && !expanded[s.id] ? Math.max(0, s.items.length - COLLAPSED_ROWS) : 0;

	const total = $derived(data.sentToday + workCount);

	// Selection follows the visible order. When the selected follow-up is closed, or snoozed out of
	// the open sections, it leaves the list and the card moves on to whoever now sits in its place.
	const flat = $derived(sections.filter((s) => !isFolded(s.id)).flatMap(visibleRows));
	const pool = $derived(allSections.filter((s) => !isFolded(s.id)).flatMap((s) => s.items));
	let selectedId = $state<string | null>(null);
	let saved = $state<{ item: QueueRowItem; nextFollowUpId: string | null } | null>(null);
	let lastIndex = 0;
	let sheetOpen = $state(false);
	const selected = $derived(pool.find((i) => i.followUpId === selectedId) ?? null);
	const position = $derived(selected ? flat.indexOf(selected) : -1);
	// The customer whose outcome was just saved stays open ("Hasil tersimpan") until the user moves on.
	const savedHere = $derived(saved && saved.item.followUpId === selectedId ? saved : null);
	const displayed = $derived(selected ?? savedHere?.item ?? null);
	const canPrev = $derived(position >= 0 ? position > 0 : lastIndex > 0);
	const canNext = $derived(position >= 0 ? position < flat.length - 1 : lastIndex < flat.length);
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
			selectedId = next?.followUpId ?? null;
			if (!next) sheetOpen = false;
		} else if (!selectedId && wide.current && tab === 'all' && !dayDone && flat.length > 0) {
			selectedId = flat[0].followUpId;
		}
	});

	function select(item: QueueRowItem) {
		saved = null;
		selectedId = item.followUpId;
		lastIndex = Math.max(0, flat.indexOf(item));
		if (!wide.current) sheetOpen = true;
	}

	function step(by: 1 | -1) {
		// Once the saved follow-up has left the list, step from the slot it occupied.
		const next = position >= 0 ? flat[position + by] : flat[lastIndex + (by > 0 ? 0 : -1)];
		if (next) select(next);
	}

	function outcomeSaved(result: { nextFollowUpId: string | null }) {
		if (displayed) saved = { item: displayed, nextFollowUpId: result.nextFollowUpId };
	}

	function clearSaved() {
		saved = null;
	}

	// Keyboard: on desk j / k step through the queue like a mail client. Ignored while typing.
	function onkeydown(e: KeyboardEvent) {
		if (e.metaKey || e.ctrlKey || e.altKey || !wide.current) return;
		const t = e.target;
		if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable]')) return;
		if (e.key === 'j') step(1);
		else if (e.key === 'k') step(-1);
	}
</script>

<svelte:window {onkeydown} />

{#snippet meta()}
	<span class="num">{m.today_summary({ count: workCount, waiting: data.waiting.length })}</span>
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
	{#if position >= 0 || savedHere}
		<div class="flex items-center gap-1">
			{#if position >= 0}
				<span class="mr-1 text-xs text-muted-foreground num">
					{m.queue_position(place)}
				</span>
			{/if}
			<Button
				variant="ghost"
				size="icon"
				aria-label={m.queue_prev()}
				disabled={!canPrev}
				onclick={() => step(-1)}
			>
				<ChevronUpIcon />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				aria-label={m.queue_next()}
				disabled={!canNext}
				onclick={() => step(1)}
			>
				<ChevronDownIcon />
			</Button>
		</div>
	{/if}
{/snippet}

<div class="lg:grid lg:h-dvh lg:grid-cols-[minmax(0,1fr)_400px]">
	<div class="flex min-h-dvh flex-col bg-card lg:min-h-0 lg:overflow-y-auto">
		<PageHeader title={m.queue_title()} metaInline="md" {meta} {search} {actions} />

		<div
			class="flex flex-col px-4 pb-3 md:h-11 md:flex-row md:items-center md:gap-5 md:border-b md:border-rule md:px-5 md:pb-0"
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
					<QueueProgress sent={data.sentToday} {total} />
				</div>
			{/if}
		</div>

		{#if dayDone && !query}
			<QueueDone
				sentToday={data.sentToday}
				waitingCount={data.waiting.length}
				next={data.upcoming[0]}
			/>
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

	{#if wide.current}
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
						saved={savedHere}
						onsaved={outcomeSaved}
						onundo={clearSaved}
					/>
				</div>
			{:else if dayDone && !query && tab === 'all'}
				<QueueDaySummary
					sentToday={data.sentToday}
					waitingCount={data.waiting.length}
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
				? 'data-[vaul-drawer-direction=right]:w-[430px] data-[vaul-drawer-direction=right]:max-w-full data-[vaul-drawer-direction=right]:rounded-l-[20px] data-[vaul-drawer-direction=right]:shadow-[-12px_0_40px_#0F141929] data-[vaul-drawer-direction=right]:sm:max-w-full'
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
					/>
				{/if}
			</div>
		</Drawer.Content>
	</Drawer.Root>
{/if}
