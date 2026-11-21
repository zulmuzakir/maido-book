<script lang="ts">
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import ActivityTab from './activity-tab.svelte';
	import CustomerData from './customer-data.svelte';
	import CustomerHeader from './customer-header.svelte';
	import NextFollowUp from './next-follow-up.svelte';
	import OrderHistory from './order-history.svelte';
	import SupplySection from './supply-section.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const c = $derived(data.customer);
	const latest = $derived(data.orders[0] ?? null);

	let tab = $state<'summary' | 'activity'>('summary');
	const tabItems = $derived([
		{ key: 'summary', label: m.customer_tab_summary() },
		{ key: 'activity', label: m.customer_tab_activity() }
	]);
	const summary = $derived(tab === 'summary');
</script>

<!-- Phone/tablet: one column (follow-up first). Desktop: the tab's content on the left and a
     360px aside with the follow-up card, customer data and notes, on both tabs. -->
<div class="min-h-dvh bg-card pb-[72px] md:pb-0">
	<CustomerHeader
		customer={c}
		{latest}
		panelItem={data.panelItem}
		today={data.today}
		leadDays={data.rules.leadDays}
	/>

	<div class="px-4 md:mt-[22px] md:px-6 xl:px-8">
		<div class="md:border-b md:border-rule">
			<FilterTabs
				items={tabItems}
				active={tab}
				onselect={(key) => (tab = key === 'activity' ? 'activity' : 'summary')}
				label={m.customer_tabs_label()}
			/>
		</div>
	</div>

	<div
		class="flex flex-col gap-7 px-4 pt-5 pb-6 md:px-6 md:pt-6 xl:grid xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-0 xl:pt-0 xl:pr-0 xl:pb-0 xl:pl-8"
	>
		<div class="contents xl:flex xl:min-w-0 xl:flex-col xl:gap-8 xl:py-6 xl:pr-8">
			{#if summary}
				<SupplySection
					class="order-2"
					customerId={c.id}
					dosePerDay={c.dosePerDay}
					orders={data.orders}
					today={data.today}
				/>
				<OrderHistory
					class="order-3"
					orders={data.orders}
					today={data.today}
					leadDays={data.rules.leadDays}
					truncated={data.ordersTruncated}
				/>
			{:else}
				<ActivityTab
					class="order-2"
					activities={data.activities}
					maxAttempts={data.rules.maxAttempts}
					{form}
					truncated={data.activitiesTruncated}
				/>
			{/if}
		</div>

		<aside
			class="contents xl:flex xl:flex-col xl:gap-7 xl:border-l xl:border-rule xl:px-6 xl:pt-6 xl:pb-8"
		>
			<NextFollowUp
				class="order-1"
				customerId={c.id}
				customerName={c.name}
				openFollowUp={data.openFollowUp}
				panelItem={data.panelItem}
				{latest}
				today={data.today}
				rules={data.rules}
				{form}
			/>
			<CustomerData
				class="order-4 {summary ? '' : 'hidden xl:grid'}"
				customer={c}
				{latest}
				today={data.today}
			/>
		</aside>
	</div>
</div>
