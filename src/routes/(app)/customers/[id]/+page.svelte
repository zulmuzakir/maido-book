<script lang="ts">
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import ActivityTab from './activity-tab.svelte';
	import CustomerData from './customer-data.svelte';
	import CustomerHeader from './customer-header.svelte';
	import NextFollowUp from './next-follow-up.svelte';
	import OrderHistory from './order-history.svelte';
	import SupplySection from './supply-section.svelte';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const c = $derived(data.customer);
	const latest = $derived(data.orders[0] ?? null);

	let tab = $state<'activity' | 'order'>('order');
	const tabItems = $derived([
		{ key: 'activity', label: m.customer_tab_activity() },
		{ key: 'order', label: m.customer_tab_orders() }
	]);
	const onOrder = $derived(tab === 'order');
	// Supply chart spans the top row on tablet and sits in the left column on desktop, so the
	// follow-up aside and the tab's main content shift up when the chart is absent.
	const asideCell = $derived(
		onOrder
			? 'md:col-start-2 md:row-start-2 xl:col-start-2 xl:row-span-2 xl:row-start-1'
			: 'md:col-start-2 md:row-start-1 xl:col-start-2 xl:row-span-2 xl:row-start-1'
	);
	const mainCell = $derived(
		onOrder
			? 'md:col-start-1 md:row-start-2 md:pt-6 xl:col-start-1 xl:row-start-2 xl:pt-6'
			: 'md:col-start-1 md:row-start-1 md:pt-6 xl:col-start-1 xl:row-start-1 xl:pt-6'
	);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<CustomerHeader
		customer={c}
		{latest}
		panelItem={data.panelItem}
		today={data.today}
		leadDays={data.rules.leadDays}
	/>

	<div class="border-b border-rule px-4 py-3 md:px-6 md:py-0 xl:px-7">
		<FilterTabs
			items={tabItems}
			active={tab}
			onselect={(key) => (tab = key === 'activity' ? 'activity' : 'order')}
			label={m.customer_tabs_label()}
			underline
		/>
	</div>

	<!-- Phone stacks: chart, follow-up, orders or activity, data (order-* below). Desktop places by grid cell. -->
	<div
		class="grid gap-6 px-4 py-5 md:grid-cols-[minmax(0,1fr)_300px] md:gap-x-0 md:px-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_1fr] xl:gap-0 xl:px-0 xl:py-0"
	>
		{#if onOrder}
			<SupplySection
				customerId={c.id}
				dosePerDay={c.dosePerDay}
				orders={data.orders}
				today={data.today}
				leadDays={data.rules.leadDays}
				dueDate={data.openFollowUp?.dueDate ?? null}
			/>
		{/if}

		<aside
			class="contents md:block md:space-y-[18px] md:pt-6 xl:space-y-[22px] xl:border-l xl:border-rule xl:px-6 xl:pt-6 {asideCell}"
		>
			<div class="order-1 space-y-4">
				<NextFollowUp
					customerId={c.id}
					openFollowUp={data.openFollowUp}
					panelItem={data.panelItem}
					{latest}
					today={data.today}
					rules={data.rules}
					{form}
				/>
			</div>
			<div class="order-3">
				<CustomerData customer={c} {latest} today={data.today} showNotes={onOrder} />
			</div>
		</aside>

		<div class="contents md:block md:min-w-0 md:space-y-8 xl:px-7 xl:pb-6 {mainCell}">
			<div class="order-2 min-w-0">
				{#if onOrder}
					<OrderHistory
						orders={data.orders}
						today={data.today}
						leadDays={data.rules.leadDays}
						truncated={data.ordersTruncated}
					/>
				{:else}
					<ActivityTab
						activities={data.activities}
						maxAttempts={data.rules.maxAttempts}
						{form}
						truncated={data.activitiesTruncated}
					/>
				{/if}
			</div>
		</div>
	</div>
</div>
