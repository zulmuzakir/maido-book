<script lang="ts">
	import { enhance } from '$app/forms';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import StockText from '#lib/components/stock-text.svelte';
	import SupplyTrack from '#lib/components/supply-track.svelte';
	import WaIconButton from '#lib/components/wa-icon-button.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { sentToast } from '#lib/follow-up-undo.ts';
	import { firstName } from '#lib/format.ts';
	import { formatDate } from '#lib/domain/dates.ts';
	import type { RuleSettings } from '#lib/domain/types.ts';
	import { dueState, type QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		item,
		today,
		rules,
		selected = false,
		onselect
	}: {
		item: QueueRowItem;
		today: string;
		rules: RuleSettings;
		selected?: boolean;
		onselect: () => void;
	} = $props();

	const due = $derived(dueState(item, today, rules));
	const locale = $derived(getLocale());
	// Supply only matters while the customer is still on their last order: a sent message is waiting
	// on a reply, and a win-back ran out long ago.
	const track = $derived(
		item.lastOrder && due.bucket !== 'waiting' && item.kind !== 'winback' ? item.lastOrder : null
	);
	// The row's WhatsApp tap logs the send at once, so it always confirms and can be taken back.
	const sent = new FormAction(async ({ result, update }) => {
		if (result.type === 'success' && result.data?.action === 'sent') {
			sentToast(firstName(item.customer.name), result.data.undo);
		}
		await update();
	});
	let form: HTMLFormElement | undefined = $state();

	/** Opens WhatsApp and records the send. The waiting button opens the window itself. */
	function sendNow() {
		window.open(item.waUrl, '_blank', 'noopener');
		form?.requestSubmit();
	}
</script>

<div
	class={cn(
		'flex h-[68px] items-center gap-3 border-b border-row-rule px-4 transition-colors md:h-[60px] md:gap-3.5 md:px-5',
		selected ? 'bg-accent ring-1 ring-selected-ring ring-inset' : 'hover:bg-muted'
	)}
>
	<button
		type="button"
		onclick={onselect}
		aria-current={selected ? 'true' : undefined}
		class="flex min-w-0 flex-1 items-center gap-3.5 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
	>
		<PersonSummary
			name={item.customer.name}
			nameClass="truncate text-[15px] font-semibold leading-[18px] md:text-sm md:leading-[18px]"
			class="flex-1 gap-3.5"
		>
			<span class="truncate text-ui text-muted-foreground">
				{#if due.bucket === 'waiting'}
					{#if item.lastOrder}
						{m.queue_row_order({ date: formatDate(item.lastOrder.orderDate, locale, 'short') })}
					{/if}
					<span class={due.tone}>{due.label}</span>
				{:else if item.lastOrder}
					{m.queue_row_order({ date: formatDate(item.lastOrder.orderDate, locale, 'short') })}
					<StockText lastOrder={item.lastOrder} {today} leadDays={rules.leadDays} />
				{:else}
					<StockText lastOrder={null} {today} leadDays={rules.leadDays} />
				{/if}
			</span>
			{#if track}
				<!-- The stock text above already names the state; the track is for the eye only. -->
				<SupplyTrack
					orderDate={track.orderDate}
					daysSupply={track.daysSupply}
					{today}
					leadDays={rules.leadDays}
					label={false}
					class="mt-1 max-w-40 md:hidden"
					decorative
				/>
			{/if}
		</PersonSummary>
		{#if track}
			<div class="hidden w-[150px] shrink-0 flex-col gap-1.5 md:flex">
				<SupplyTrack
					orderDate={track.orderDate}
					daysSupply={track.daysSupply}
					{today}
					leadDays={rules.leadDays}
					label={false}
					decorative
				/>
				<span class="truncate text-right text-ui text-muted-foreground num">
					{m.queue_row_dose({
						qty: track.qty,
						unit: track.unitLabel,
						dose: item.customer.dosePerDay
					})}
				</span>
			</div>
		{/if}
	</button>

	<form bind:this={form} method="post" action="?/sent" use:enhance={sent.enhance} class="shrink-0">
		<input type="hidden" name="followUpId" value={item.followUpId} />
		{#if due.bucket === 'waiting'}
			<Button
				type="button"
				variant="outline"
				size="sm"
				class="h-11 px-3 text-ui font-semibold text-foreground desk:h-8"
				disabled={sent.pending}
				onclick={sendNow}
			>
				{m.today_resend()}
			</Button>
		{:else}
			<WaIconButton
				href={item.waUrl}
				label={m.queue_send_log_to({ name: item.customer.name })}
				disabled={sent.pending}
				onclick={() => form?.requestSubmit()}
			/>
		{/if}
	</form>
</div>
