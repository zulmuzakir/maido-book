<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import InfoIcon from '@lucide/svelte/icons/info';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import FollowUpOutcome, { type SavedOutcome } from '#lib/components/follow-up-outcome.svelte';
	import FollowUpSnooze from '#lib/components/follow-up-snooze.svelte';
	import * as AlertDialog from '#lib/components/ui/alert-dialog/index.js';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import SupplyTrack from '#lib/components/supply-track.svelte';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { formatPhone, waLink } from '#lib/domain/phone.ts';
	import { customerStatusLabel } from '#lib/labels.ts';
	import type { ManualOutcome, RuleSettings } from '#lib/domain/types.ts';
	import { toTemplate } from '#lib/domain/template.ts';
	import { firstName } from '#lib/format.ts';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { sentToast } from '#lib/follow-up-undo.ts';
	import { dueState, type QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		item,
		today,
		rules,
		onsaved,
		onundo,
		onsent,
		stickySend = false
	}: {
		item: QueueRowItem;
		today: string;
		rules: RuleSettings;
		/** Reports a saved outcome; the page then moves on (the toast carries the undo). */
		onsaved?: (result: SavedOutcome) => void;
		/** Runs once an undo from the toast has finished and the follow-up is back in the queue. */
		onundo?: () => void;
		/** Reports a logged send, so the page can keep "next" pointing into today's work. */
		onsent?: () => void;
		/** Phone detail: the send sits in a bar pinned to the bottom instead of under the message. */
		stickySend?: boolean;
	} = $props();

	const locale = $derived(getLocale());
	const due = $derived(dueState(item, today, rules));
	const waiting = $derived(due.bucket === 'waiting');
	const customerHref = $derived(resolve('/(app)/customers/[id]', { id: item.customer.id }));
	const sendFormId = $derived(`send-${item.followUpId}`);

	// The message is edited per follow-up. Callers key the card by `item.followUpId`, so moving to
	// another follow-up starts fresh, while a template save (a reload of the same follow-up) keeps
	// the edit.
	let editing = $state(false);
	let edited = $state(untrack(() => item.message));
	let templateConfirm = $state(false);
	// A picked outcome hides the message and the snooze until it is saved or cancelled.
	let outcomeChoice = $state<ManualOutcome | null>(null);
	const changed = $derived(edited !== item.message);

	// "±3 hari sisa stok · habis sekitar 12 Nov", or how long ago the stock ran out.
	const supply = $derived.by(() => {
		const o = item.lastOrder;
		if (!o) return null;
		const { daysLeft } = supplyStatus({ orderDate: o.orderDate, daysSupply: o.daysSupply, today });
		const runOut = formatDate(addDays(o.orderDate, o.daysSupply), locale, 'short');
		return {
			big: daysLeft > 0 ? `±${daysLeft}` : String(-daysLeft),
			text:
				daysLeft > 0
					? m.card_supply_left({ date: runOut })
					: daysLeft === 0
						? m.card_supply_out_today()
						: m.card_supply_out({ date: runOut }),
			tone:
				daysLeft > rules.leadDays
					? 'text-foreground'
					: daysLeft > 0
						? 'text-status-today'
						: 'text-status-overdue'
		};
	});

	const sent = new FormAction(async ({ result, update }) => {
		if (result.type === 'success' && result.data?.action === 'sent') {
			sentToast(firstName(item.customer.name), result.data.undo);
			editing = false;
			onsent?.();
		}
		await update();
	});
	const saveTemplate = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') toast.success(m.toast_template_saved());
		await update({ reset: false });
	});

	// WhatsApp must open synchronously inside the click, or pop-up blockers stop it.
	function openWhatsApp() {
		window.open(waLink(item.customer.phone, edited), '_blank', 'noopener');
	}

	const sendLabel = $derived(
		waiting ? m.today_resend() : m.queue_send_to({ name: firstName(item.customer.name) })
	);
	const section = 'flex flex-col gap-3 border-t border-rule px-6 py-[18px]';
</script>

{#snippet sendButton(cls: string)}
	<Button
		type="submit"
		form={sendFormId}
		variant="whatsapp"
		class={cls}
		disabled={sent.pending}
		onclick={openWhatsApp}
	>
		<MessageCircleIcon class="size-[18px]" aria-hidden="true" />
		{sendLabel}
	</Button>
{/snippet}

<article class="flex min-h-full flex-col">
	<div class="flex-1">
		<header class="flex items-center gap-3 px-6 pt-[22px] pb-[18px]">
			<InitialsAvatar
				name={item.customer.name}
				size={48}
				class="bg-avatar text-[17px] font-extrabold text-avatar-foreground"
			/>
			<div class="min-w-0 flex-1">
				<h2 class="text-lg leading-[22px] font-bold tracking-[-0.01em] break-words">
					{item.customer.name}
				</h2>
				<p class="mt-0.5 text-ui text-muted-foreground num">
					{formatPhone(item.customer.phone)} · {customerStatusLabel(item.customer.status)}
				</p>
			</div>
			<a
				href={customerHref}
				class="-mr-1 shrink-0 rounded-sm px-1 py-1 text-[13.5px] font-semibold text-primary-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
			>
				{m.card_profile()}
			</a>
		</header>

		{#if item.lastOrder && supply}
			<section class={section}>
				<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
					<span class="text-[34px] leading-none font-bold tracking-[-0.03em] num {supply.tone}"
						>{supply.big}</span
					>
					<span class="text-sm text-muted-foreground">{supply.text}</span>
				</p>
				<SupplyTrack
					orderDate={item.lastOrder.orderDate}
					daysSupply={item.lastOrder.daysSupply}
					{today}
					leadDays={rules.leadDays}
					label={false}
					decorative
				/>
				<p class="text-ui text-muted-foreground num">
					{m.card_last_order({
						qty: item.lastOrder.qty,
						unit: item.lastOrder.unitLabel,
						product: item.lastOrder.productName,
						date: formatDate(item.lastOrder.orderDate, locale, 'short')
					})}{m.queue_dose_suffix({ dose: item.customer.dosePerDay })}
				</p>
			</section>
		{/if}

		<AlertDialog.Root bind:open={templateConfirm}>
			<AlertDialog.Content>
				<form method="post" action="?/saveTemplate" use:enhance={saveTemplate.enhance}>
					<input type="hidden" name="kind" value={item.kind} />
					<input type="hidden" name="body" value={toTemplate(edited, item.vars)} />
					<AlertDialog.Header>
						<AlertDialog.Title>{m.queue_template_confirm_title()}</AlertDialog.Title>
						<AlertDialog.Description
							>{m.queue_template_confirm_description()}</AlertDialog.Description
						>
					</AlertDialog.Header>
					<AlertDialog.Footer class="mt-4">
						<AlertDialog.Cancel type="button">{m.cancel()}</AlertDialog.Cancel>
						<AlertDialog.Action type="submit" disabled={saveTemplate.pending}>
							{m.queue_template_confirm()}
						</AlertDialog.Action>
					</AlertDialog.Footer>
				</form>
			</AlertDialog.Content>
		</AlertDialog.Root>

		<!-- The send form holds only the data; its buttons sit in the message section, or in the
		     bottom bar while editing. -->
		<form id={sendFormId} method="post" action="?/sent" use:enhance={sent.enhance} class="hidden">
			<input type="hidden" name="followUpId" value={item.followUpId} />
			{#if changed}<input type="hidden" name="body" value={edited} />{/if}
		</form>

		{#if !outcomeChoice}
			<section class={section}>
				<div class="flex min-h-9 items-center justify-between gap-2">
					<h3 class="text-ui font-semibold text-foreground">{m.queue_message_label()}</h3>
					{#if editing}
						<span class="text-ui font-medium text-muted-foreground">{m.queue_editing()}</span>
					{:else}
						<Button
							type="button"
							variant="inline"
							class="-mr-2.5 h-9 gap-1.5 px-2.5 text-[13.5px] desk:h-9"
							onclick={() => (editing = true)}
						>
							<PencilIcon data-icon="inline-start" aria-hidden="true" />
							{m.edit()}
						</Button>
					{/if}
				</div>

				{#if editing}
					<Textarea
						bind:value={edited}
						rows={5}
						maxlength={1000}
						aria-label={m.queue_message_label()}
						class="h-[132px] min-h-0 resize-none rounded-[8px] border-field-active px-3.5 py-3 text-[14.5px] leading-[22px] ring-3 ring-ring focus-visible:ring-3"
					/>
					<div class="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
						<span class="text-ui text-muted-foreground num">
							{m.queue_char_count({ count: edited.length })}
						</span>
						<div class="-mr-2.5 flex gap-1">
							<Button
								type="button"
								variant="inline"
								class="h-9 px-2.5 text-[13.5px] desk:h-9"
								disabled={!changed}
								onclick={() => (edited = item.message)}
							>
								{m.queue_reset()}
							</Button>
							<Button
								type="button"
								variant="inline"
								class="h-9 px-2.5 text-[13.5px] desk:h-9"
								onclick={() => (templateConfirm = true)}
							>
								{m.queue_save_template()}
							</Button>
						</div>
					</div>
					<p
						class="flex items-start gap-2.5 rounded-[8px] bg-surface-inset px-3.5 py-3 text-sm leading-[21px] text-foreground"
					>
						<InfoIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
						<span class="flex-1">
							{m.queue_edit_note({ name: firstName(item.customer.name) })}
						</span>
					</p>
				{:else}
					<blockquote
						class="rounded-[8px] bg-background px-3.5 py-3 text-[14.5px] leading-[22px] whitespace-pre-wrap text-foreground"
					>
						{edited}
					</blockquote>
					{#if !stickySend}{@render sendButton('h-12 w-full text-[15px] desk:h-12')}{/if}
				{/if}
			</section>
		{/if}

		<FollowUpOutcome {item} {today} {rules} {onsaved} {onundo} bind:choice={outcomeChoice} />

		{#if !outcomeChoice}
			<FollowUpSnooze followUpId={item.followUpId} {today} />
		{/if}
	</div>

	{#if stickySend && !editing && !outcomeChoice}
		<div
			class="sticky bottom-0 z-10 border-t border-rule bg-card px-4 py-2.5 shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)]"
		>
			{@render sendButton('h-12 w-full text-[15px]')}
		</div>
	{:else if editing && !outcomeChoice}
		<!-- While editing, the send and "Selesai" stay in reach at the bottom of the panel. -->
		<div
			class={cn(
				'sticky bottom-0 z-10 flex gap-2 border-t border-rule bg-card px-6 py-3.5',
				'shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)]'
			)}
		>
			{@render sendButton('h-11 min-w-0 flex-1 desk:h-11')}
			<Button
				type="button"
				variant="outline"
				class="h-11 w-[100px] desk:h-11"
				onclick={() => (editing = false)}
			>
				{m.queue_done_editing()}
			</Button>
		</div>
	{/if}
</article>
