<script lang="ts">
	import { goto } from '$app/navigation';
	import { MediaQuery } from 'svelte/reactivity';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UploadIcon from '@lucide/svelte/icons/upload';
	import UsersIcon from '@lucide/svelte/icons/users';
	import EmptyState from '#lib/components/empty-state.svelte';
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import HeaderSearch from '#lib/components/header-search.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageData } from './$types';
	import CustomerList from './customer-list.svelte';
	import CustomerPager from './customer-pager.svelte';

	let { data }: { data: PageData } = $props();

	const STATUS_ITEMS = ['all', 'interested', 'lead', 'active', 'dormant'] as const;
	type StatusKey = (typeof STATUS_ITEMS)[number];
	const statusLabel = (s: StatusKey) =>
		({
			all: m.customers_filter_all,
			interested: m.customers_filter_interested,
			lead: m.status_lead,
			active: m.status_active,
			dormant: m.status_dormant
		})[s]();

	// Follows the URL (clear search, Back/Forward, tabs); typing overrides it until the next load.
	let q = $derived(data.q);
	// The search sits in the header from lg; below that it has its own full-width row.
	const wide = new MediaQuery('(min-width: 1024px)');
	let timer: ReturnType<typeof setTimeout> | undefined;

	// A search still waiting to fire must not pull the user back here after they navigate away.
	$effect(() => () => clearTimeout(timer));

	/** Builds the current list URL with some params changed. `null` or an empty value removes a param. */
	function listHref(changes: Record<string, string | null>) {
		const u = new URL(page.url.href);
		for (const [key, value] of Object.entries(changes)) {
			if (value === null || value === '' || (key === 'status' && value === 'all')) {
				u.searchParams.delete(key);
			} else {
				u.searchParams.set(key, value);
			}
		}
		return `${resolve('/(app)/customers')}${u.search}`;
	}

	// href is built from resolve() in `listHref`
	// eslint-disable-next-line svelte/no-navigation-without-resolve
	const go = (href: string) => goto(href, { replace: true, reset: false });

	function scheduleSearch(value: string) {
		clearTimeout(timer);
		timer = setTimeout(() => go(listHref({ q: value.trim(), page: null, n: null })), 250);
	}

	function onSearchSubmit(e: SubmitEvent) {
		e.preventDefault();
		clearTimeout(timer);
		go(listHref({ q: q.trim(), page: null, n: null }));
	}

	const pages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const from = $derived((data.page - 1) * data.pageSize + 1);
	const to = $derived(Math.min(data.total, data.page * data.pageSize));
	const hasPrev = $derived(data.page > 1);
	const hasNext = $derived(data.page * data.pageSize < data.total);
	const moreHref = $derived(
		data.page === 1 && hasNext
			? listHref({ n: String(data.pageSize + data.step), page: null })
			: null
	);
	const summary = $derived(
		data.q
			? m.customers_match({ count: data.total, q: data.q })
			: m.customers_count({ count: data.total })
	);

	const tabItems = $derived(
		STATUS_ITEMS.map((s) => ({
			key: s,
			label: statusLabel(s),
			count: data.counts[s],
			href: listHref({ status: s, page: null, n: null })
		}))
	);
</script>

{#snippet searchField()}
	<form
		method="get"
		action={resolve('/(app)/customers')}
		onsubmit={onSearchSubmit}
		role="search"
		class="contents"
	>
		<input type="hidden" name="status" value={data.status} />
		<HeaderSearch
			id="customer-search"
			name="q"
			bind:value={q}
			block={!wide.current}
			label={m.customers_search_label()}
			placeholder={m.customers_search_placeholder()}
			oninput={scheduleSearch}
		/>
		<button type="submit" class="sr-only">{m.customers_search_button()}</button>
	</form>
{/snippet}

<!-- Desktop: search and "Tambah pelanggan" in the header. Tablet/phone: the search is its own
     full-width row under the title; the phone's add button is a purple "+ Tambah". -->
<div class="flex min-h-dvh flex-col bg-card">
	<PageHeader title={data.title} metaInline="md" class={wide.current ? '' : 'md:border-b-0'}>
		{#snippet meta()}
			<span class="num">
				{data.total === 0 && data.q
					? m.customers_no_results_meta({ q: data.q })
					: m.customers_count({ count: data.total })}
			</span>
		{/snippet}
		{#snippet search()}
			{#if wide.current}{@render searchField()}{/if}
		{/snippet}
		{#snippet actions()}
			<Button href={resolve('/(app)/customers/new')} class="hidden font-semibold md:inline-flex">
				<PlusIcon class="size-[18px]" aria-hidden="true" />
				{m.customers_add()}
			</Button>
			<Button
				variant="ghost"
				href={resolve('/(app)/customers/new')}
				class="px-3 font-semibold text-primary-text md:hidden"
			>
				<PlusIcon class="size-[18px]" aria-hidden="true" />
				{m.customers_add_short()}
			</Button>
		{/snippet}
	</PageHeader>

	{#if !wide.current}
		<div class="px-4 pb-3 md:px-6 md:pt-1">{@render searchField()}</div>
	{/if}

	<div class="flex flex-1 flex-col">
		{#if data.total > 0 || (data.status !== 'all' && !data.q)}
			<div class="px-4 pb-3 md:border-b md:border-rule md:px-6 md:pb-0 xl:px-8">
				<FilterTabs items={tabItems} active={data.status} label={m.customers_filter_label()} />
			</div>
		{/if}

		{#if data.total === 0}
			<div class="flex flex-1 items-center justify-center pb-10">
				{#if data.q !== ''}
					<EmptyState
						icon={SearchIcon}
						title={m.customers_no_results_title()}
						description={m.customers_no_results({ q: data.q })}
					>
						{#snippet actions()}
							<Button variant="outline" href={listHref({ q: null, page: null, n: null })}>
								{m.customers_clear_search()}
							</Button>
						{/snippet}
					</EmptyState>
				{:else if data.status !== 'all'}
					<EmptyState icon={UsersIcon} title={m.customers_no_status()}>
						{#snippet actions()}
							<Button variant="outline" href={listHref({ status: null, page: null, n: null })}>
								{m.customers_show_all()}
							</Button>
						{/snippet}
					</EmptyState>
				{:else}
					<EmptyState
						icon={UsersIcon}
						tone="brand"
						title={m.customers_empty_title()}
						description={m.customers_empty_description()}
					>
						{#snippet actions()}
							<Button href={resolve('/(app)/import')}>
								<UploadIcon class="size-[18px]" aria-hidden="true" />
								{m.customers_import()}
							</Button>
							<Button variant="outline" href={resolve('/(app)/customers/new')}>
								<PlusIcon class="size-[18px]" aria-hidden="true" />
								{m.customers_add()}
							</Button>
						{/snippet}
					</EmptyState>
				{/if}
			</div>
		{:else}
			<div class="flex flex-1 flex-col">
				<CustomerList items={data.items} today={data.today} leadDays={data.leadDays} />

				<CustomerPager
					page={data.page}
					{pages}
					{from}
					{to}
					total={data.total}
					{summary}
					prevHref={hasPrev ? listHref({ page: String(data.page - 1) }) : null}
					nextHref={hasNext ? listHref({ page: String(data.page + 1) }) : null}
					{moreHref}
					moreCount={Math.min(data.step, data.total - to)}
				/>
			</div>
		{/if}
	</div>
</div>
