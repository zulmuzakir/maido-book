<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import FollowUpOutcome from '#lib/components/follow-up-outcome.svelte';
	import FollowUpSnooze from '#lib/components/follow-up-snooze.svelte';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '#lib/components/ui/alert-dialog/index.js';
	import PersonSummary from '#lib/components/person-summary.svelte';
	import SupplyTrack from '#lib/components/supply-track.svelte';
	import WhatsappIcon from '#lib/components/whatsapp-icon.svelte';
	import { formatDate } from '#lib/domain/dates.ts';
	import { formatPhone, waLink } from '#lib/domain/phone.ts';
	import { customerStatusLabel, outcomeLabel } from '#lib/labels.ts';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import type { ManualOutcome, RuleSettings } from '#lib/domain/types.ts';
	import { toTemplate } from '#lib/domain/template.ts';
	import { firstName } from '#lib/format.ts';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { sentToast } from '#lib/follow-up-undo.ts';
	import { dueState, type QueueRowItem } from '#lib/queue.ts';
	import type { SavedOutcome } from '#lib/components/follow-up-outcome.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		item,
		today,
		rules,
		stepper,
		saved = null,
		onsaved,
		onundo,
		onnext,
		hasNext = false,
		onsent
	}: {
		item: QueueRowItem;
		today: string;
		rules: RuleSettings;
		/** Optional queue stepper, shown top-right on wide screens. */
		stepper?: Snippet;
		/** Set once the outcome is saved: the card shows the read-only "Hasil tersimpan" state. */
		saved?: SavedOutcome | null;
		/** Reports a successful outcome save so the page keeps this follow-up open. */
		onsaved?: (result: SavedOutcome) => void;
		/** Runs once an undo from the toast has finished and the follow-up is back in the queue. */
		onundo?: () => void;
		/** Moves the queue to the next customer, offered once this one is done. */
		onnext?: () => void;
		hasNext?: boolean;
		/** Reports a logged send, so the page can keep "next" pointing into today's work. */
		onsent?: () => void;
	} = $props();

	const locale = $derived(getLocale());
	const due = $derived(dueState(item, today, rules));
	const waiting = $derived(due.bucket === 'waiting');
	const customerHref = $derived(resolve('/(app)/customers/[id]', { id: item.customer.id }));

	// The message is edited per follow-up. Edits survive a template save (a reload of the same
	// follow-up) and reset only when the queue moves to another follow-up.
	let editing = $state(false);
	let edited = $state(untrack(() => item.message));
	let templateConfirm = $state(false);
	// A picked outcome hides the message and the WhatsApp send until it is saved or cancelled.
	let outcomeChoice = $state<ManualOutcome | null>(null);
	// Before the first message the outcome grid stays behind "Sudah ada balasan?": the job is to send.
	let replyOpen = $state(false);
	// Just sent from this card: the reply has not had time to come, so the card points to the next
	// customer instead of leading with the outcome grid.
	let justSent = $state(false);
	// Once the outcome is saved, sending again is the exception: it waits behind a quiet link.
	let resendOpen = $state(false);
	$effect(() => {
		void item.followUpId;
		untrack(() => {
			edited = item.message;
			editing = false;
			outcomeChoice = null;
			replyOpen = false;
			justSent = false;
			resendOpen = false;
		});
	});
	const changed = $derived(edited !== item.message);

	const sent = new FormAction(async ({ result, update }) => {
		if (result.type === 'success' && result.data?.action === 'sent') {
			sentToast(firstName(item.customer.name), result.data.undo);
			justSent = true;
			onsent?.();
		} else if (result.type === 'success' && result.data?.action === 'resend') {
			sentToast(firstName(item.customer.name), result.data.undo, 'undoResend');
		}
		await update();
	});
	const leadWithOutcome = $derived(waiting && !justSent);
	const saveTemplate = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') toast.success(m.toast_template_saved());
		await update({ reset: false });
	});

	// WhatsApp must open synchronously inside the click, or pop-up blockers stop it.
	function openWhatsApp() {
		window.open(waLink(item.customer.phone, edited), '_blank', 'noopener');
	}
</script>

{#snippet nextButton()}
	<Button class="h-11 w-full text-sm desk:h-10" onclick={onnext}>
		{m.queue_next()}
		<kbd
			class="ml-1 hidden rounded-[4px] border border-primary-foreground/30 px-1.5 text-xs font-medium lg:inline"
			>J</kbd
		>
	</Button>
{/snippet}

{#snippet quietResend()}
	{#if resendOpen}
		{@render message()}
	{:else}
		<div class="border-t border-rule px-5 py-3">
			<Button
				type="button"
				variant="ghost"
				class="-mx-2 h-11 px-2 text-ui font-semibold text-primary-text desk:h-9"
				onclick={() => (resendOpen = true)}
			>
				{m.queue_resend_link()}
			</Button>
		</div>
	{/if}
{/snippet}

{#snippet outcome()}
	<FollowUpOutcome {item} {today} {rules} {onsaved} {onundo} bind:choice={outcomeChoice} />
{/snippet}

{#snippet message()}
	<section class="flex flex-col gap-2.5 border-t border-rule px-5 py-4">
		<div class="flex items-center justify-between gap-2">
			<h3 class="text-ui font-semibold text-foreground">{m.queue_message_label()}</h3>
			{#if editing}
				<span class="text-ui text-hint-foreground">{m.queue_editing()}</span>
			{:else}
				<Button
					type="button"
					variant="outline"
					size="sm"
					class="h-11 rounded-lg border-rule px-[10px] text-ui font-semibold text-subtle-foreground desk:h-8"
					onclick={() => (editing = true)}
				>
					{m.edit()}
				</Button>
			{/if}
		</div>

		{#if editing}
			<Textarea
				bind:value={edited}
				rows={5}
				maxlength={1000}
				class="min-h-0 w-full rounded-lg border-2 border-primary bg-card px-[14px] py-[12px] text-[15px] leading-[23px] text-foreground max-md:min-h-[150px] dark:border-accent-foreground desk:text-sm desk:leading-[21px]"
			/>
			<div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-ui">
				<span class="text-hint-foreground num">{m.queue_char_count({ count: edited.length })}</span>
				<div class="flex items-center gap-4 font-semibold text-primary-text">
					<button
						type="button"
						class="hover:underline disabled:pointer-events-none disabled:opacity-40"
						disabled={!changed}
						onclick={() => (edited = item.message)}
					>
						{m.queue_reset()}
					</button>
					<button type="button" class="hover:underline" onclick={() => (templateConfirm = true)}>
						{m.queue_save_template()}
					</button>
				</div>
			</div>
			<p class="text-ui text-hint-foreground">
				{m.queue_edit_note({ name: firstName(item.customer.name) })}
			</p>
		{:else}
			<blockquote
				class="rounded-[8px] bg-subtle px-3.5 py-3 text-sm leading-[21px] whitespace-pre-wrap text-subtle-foreground"
			>
				{edited}
			</blockquote>
		{/if}

		<form
			method="post"
			action={saved ? '?/resend' : '?/sent'}
			use:enhance={sent.enhance}
			class="flex flex-col"
		>
			<input type="hidden" name="followUpId" value={item.followUpId} />
			{#if changed || saved}<input type="hidden" name="body" value={edited} />{/if}
			<div class="flex items-center gap-2">
				<Button
					type="submit"
					variant="whatsapp"
					class={editing
						? 'h-11 flex-1 text-[15px]'
						: saved
							? 'h-11 w-full text-sm leading-[18px] desk:h-11 desk:text-sm'
							: 'flex-1 text-sm leading-[18px] desk:h-11 desk:text-sm'}
					disabled={sent.pending}
					onclick={openWhatsApp}
				>
					{#if !editing}<WhatsappIcon class={saved ? 'size-[18px]' : 'size-4'} />{/if}
					{waiting && !saved
						? m.today_resend()
						: m.queue_send_to({ name: firstName(item.customer.name) })}
				</Button>
				{#if editing}
					<Button type="button" variant="outline" class="h-11" onclick={() => (editing = false)}>
						{m.queue_done_editing()}
					</Button>
				{/if}
			</div>
		</form>
	</section>
{/snippet}

<article class="flex flex-col">
	<header class="flex items-start gap-3 px-5 pt-5 pb-3.5">
		<PersonSummary
			name={item.customer.name}
			avatarSize={44}
			href={customerHref}
			nameClass="truncate text-base leading-5 font-bold tracking-[-0.01em] text-foreground hover:underline"
			class="flex-1 items-start"
		>
			<span class="text-ui text-muted-foreground num">
				{formatPhone(item.customer.phone)} · {customerStatusLabel(item.customer.status)}
			</span>
		</PersonSummary>
		{#if stepper}{@render stepper()}{/if}
	</header>

	{#if item.lastOrder}
		<section
			class={cn('flex flex-col gap-3 px-5 pb-[18px]', outcomeChoice && !editing && 'max-md:hidden')}
		>
			<SupplyTrack
				size="lg"
				orderDate={item.lastOrder.orderDate}
				daysSupply={item.lastOrder.daysSupply}
				dueDate={item.dueDate}
				{today}
				leadDays={rules.leadDays}
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

	<AlertDialog bind:open={templateConfirm}>
		<AlertDialogContent>
			<form method="post" action="?/saveTemplate" use:enhance={saveTemplate.enhance}>
				<input type="hidden" name="kind" value={item.kind} />
				<input type="hidden" name="body" value={toTemplate(edited, item.vars)} />
				<AlertDialogHeader>
					<AlertDialogTitle>{m.queue_template_confirm_title()}</AlertDialogTitle>
					<AlertDialogDescription>{m.queue_template_confirm_description()}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter class="mt-4">
					<AlertDialogCancel type="button">{m.cancel()}</AlertDialogCancel>
					<AlertDialogAction type="submit" disabled={saveTemplate.pending}>
						{m.queue_template_confirm()}
					</AlertDialogAction>
				</AlertDialogFooter>
			</form>
		</AlertDialogContent>
	</AlertDialog>

	{#key item.followUpId}
		{#if saved}
			<section class="flex flex-col gap-3 border-t border-rule px-5 py-4" aria-live="polite">
				<div class="flex items-start gap-2.5">
					<CircleCheckIcon class="mt-px size-[18px] shrink-0 text-status-done" aria-hidden="true" />
					<div class="flex min-w-0 flex-col gap-0.5">
						<p class="text-sm font-semibold text-foreground">
							{m.queue_saved_title({ outcome: outcomeLabel(saved.outcome) })}
						</p>
						{#if saved.nextDate}
							<p class="text-ui text-muted-foreground num">
								{m.queue_saved_next({ date: formatDate(saved.nextDate, locale, 'short') })}
							</p>
						{/if}
					</div>
				</div>
				{#if onnext && hasNext}
					{@render nextButton()}
				{/if}
			</section>
			{@render quietResend()}
			{#if saved.nextFollowUpId}
				<FollowUpSnooze followUpId={saved.nextFollowUpId} {today} label={m.queue_snooze_next()} />
			{/if}
		{:else if leadWithOutcome}
			<!-- A message is out and has had time to land: the reply is what happens next. -->
			{@render outcome()}
			{#if !outcomeChoice}
				{@render message()}
				<FollowUpSnooze followUpId={item.followUpId} {today} />
			{/if}
		{:else}
			{#if justSent && !outcomeChoice}
				<section class="flex flex-col gap-3 border-t border-rule px-5 py-4" aria-live="polite">
					<div class="flex items-start gap-2.5">
						<CircleCheckIcon
							class="mt-px size-[18px] shrink-0 text-status-done"
							aria-hidden="true"
						/>
						<p class="text-sm text-foreground">
							{m.queue_sent_note({ name: firstName(item.customer.name) })}
						</p>
					</div>
					{#if onnext && hasNext}
						{@render nextButton()}
					{/if}
				</section>
			{/if}
			{#if !outcomeChoice}
				<!-- Right after a send, sending again is the exception, not the next step. -->
				{#if justSent}{@render quietResend()}{:else}{@render message()}{/if}
				<FollowUpSnooze followUpId={item.followUpId} {today} />
			{/if}
			{#if replyOpen || outcomeChoice}
				{@render outcome()}
			{:else}
				<div class="border-t border-rule px-5 py-3">
					<Button
						type="button"
						variant="ghost"
						class="-mx-2 h-11 px-2 text-ui font-semibold text-primary-text desk:h-9"
						aria-expanded={false}
						onclick={() => (replyOpen = true)}
					>
						{m.queue_reply_toggle()}
						<ChevronDownIcon class="size-4" aria-hidden="true" />
					</Button>
				</div>
			{/if}
		{/if}
	{/key}
</article>
