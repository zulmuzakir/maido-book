<script lang="ts">
	import { enhance } from '$app/forms';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
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
	const waiting = $derived(due.bucket === 'waiting');
	const order = $derived(item.lastOrder);
	// A sent message is waiting on a reply, so the stock bar only shows while nothing is pending.
	const track = $derived(order && !waiting ? order : null);
	const orderLine = $derived(
		order ? m.queue_row_order({ date: formatDate(order.orderDate, locale, 'short') }) : null
	);
	const qty = $derived(order ? m.queue_row_qty({ qty: order.qty, unit: order.unitLabel }) : '');
	const dose = $derived(
		order
			? m.queue_row_dose({ qty: order.qty, unit: order.unitLabel, dose: item.customer.dosePerDay })
			: ''
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

{#snippet status()}
	{#if waiting}
		<span class="truncate text-ui leading-4 {due.tone}">{due.label}</span>
	{:else if track}
		<!-- The status text names the state; the bar is for the eye only. -->
		<SupplyTrack
			orderDate={track.orderDate}
			daysSupply={track.daysSupply}
			{today}
			leadDays={rules.leadDays}
			decorative
		/>
	{/if}
{/snippet}

<!-- Phone: avatar, three lines (order · qty, status, bar), icon-only send.
     Tablet: avatar | name + "Order · qty · dose" | status over a 150px bar | Kirim.
     Desktop: avatar | name + order | dose | status over bar | Kirim, 72px tall. -->
<div
	class={cn(
		'grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-b border-row-rule px-4 py-2.5 transition-colors md:min-h-[72px] md:gap-x-4 md:px-6 md:py-0 xl:px-8',
		selected ? 'bg-selected shadow-[inset_3px_0_0_var(--primary-text)]' : 'hover:bg-muted'
	)}
>
	<button
		type="button"
		onclick={onselect}
		aria-current={selected ? 'true' : undefined}
		class="grid min-w-0 grid-cols-[44px_minmax(0,1fr)] items-center gap-x-3 self-stretch rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset md:grid-cols-[44px_minmax(0,1fr)_150px] md:gap-x-4 xl:grid-cols-[44px_minmax(0,1fr)_150px_160px]"
	>
		<InitialsAvatar
			name={item.customer.name}
			size={44}
			class="bg-avatar text-base font-extrabold text-avatar-foreground"
		/>
		<div class="flex min-w-0 flex-col gap-[5px] md:gap-[3px]">
			<p class="truncate text-[15px] leading-[18px] font-semibold">{item.customer.name}</p>
			<p class="truncate text-[12.5px] leading-4 text-muted-foreground num md:text-ui">
				{#if orderLine}
					{orderLine}<span class="xl:hidden">
						&nbsp;· <span class="md:hidden">{qty}</span><span class="max-md:hidden"
							>{waiting ? qty : dose}</span
						></span
					>
				{:else}
					{m.queue_no_order()}
				{/if}
			</p>
			<div class="md:hidden">{@render status()}</div>
		</div>
		<span class="hidden truncate text-ui text-muted-foreground num xl:block"
			>{waiting ? qty : dose}</span
		>
		<div class="hidden min-w-0 md:block">{@render status()}</div>
	</button>

	<form bind:this={form} method="post" action="?/sent" use:enhance={sent.enhance}>
		<input type="hidden" name="followUpId" value={item.followUpId} />
		{#if waiting}
			<Button
				type="button"
				variant="outline"
				class="h-11 px-3.5 text-sm font-semibold desk:h-11"
				disabled={sent.pending}
				onclick={sendNow}
			>
				{m.today_resend()}
			</Button>
		{:else}
			<WaIconButton
				href={item.waUrl}
				label={m.queue_send_log_to({ name: item.customer.name })}
				text={m.queue_send()}
				filled={selected}
				disabled={sent.pending}
				onclick={() => form?.requestSubmit()}
			/>
		{/if}
	</form>
</div>
