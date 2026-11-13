<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import FollowUpOutcome from '#lib/components/follow-up-outcome.svelte';
	import FollowUpSnooze from '#lib/components/follow-up-snooze.svelte';
	import ResponsiveDialog from '#lib/components/responsive-dialog.svelte';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { relativeDue } from '#lib/format.ts';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { dueState } from '#lib/queue.ts';
	import type { ActionData, PageData } from './$types';

	let {
		customerId,
		openFollowUp,
		panelItem,
		latest,
		today,
		rules,
		form
	}: {
		customerId: string;
		openFollowUp: PageData['openFollowUp'];
		panelItem: PageData['panelItem'];
		latest: PageData['orders'][number] | null;
		today: string;
		rules: PageData['rules'];
		form: ActionData;
	} = $props();

	const locale = getLocale() === 'id' ? 'id' : 'en';

	const act = $derived(form && 'action' in form ? form.action : null);
	const formErrors = $derived(
		form && 'errors' in form && form.errors ? (form.errors as Record<string, string>) : {}
	);

	const scheduleDateError = $derived(
		act === 'schedule' ? fieldError('scheduleDate', formErrors.dueDate) : undefined
	);
	const scheduleConflict = $derived(
		act === 'schedule' && !!form && !('ok' in form) && Object.keys(formErrors).length === 0
	);

	const newest = $derived(
		latest
			? supplyStatus({
					orderDate: latest.orderDate,
					daysSupply: latest.daysSupply,
					today
				})
			: null
	);

	const dueText = $derived(
		openFollowUp
			? openFollowUp.contactedAt && panelItem
				? dueState(panelItem, today, rules).label
				: relativeDue(openFollowUp.dueDate, today)
			: ''
	);
	const dueTone = $derived(
		!openFollowUp || openFollowUp.contactedAt
			? 'text-muted-foreground'
			: openFollowUp.dueDate < today
				? 'text-status-overdue'
				: openFollowUp.dueDate === today
					? 'text-status-today'
					: 'text-muted-foreground'
	);
	const autoCaption = $derived(
		openFollowUp && openFollowUp.kind === 'reorder' && newest
			? m.customer_next_auto({
					lead: rules.leadDays,
					date: formatDate(newest.runsOutOn, locale, 'medium')
				})
			: null
	);

	let scheduleOpen = $state(false);
	const scheduleAction = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') {
			scheduleOpen = false;
			toast.success(m.customer_schedule_saved());
		}
		await update({ reset: false });
	});
</script>

<div class="flex flex-col rounded-[8px] bg-subtle p-4 {openFollowUp ? 'gap-1.5' : 'gap-2.5'}">
	<h2 class="text-ui font-semibold">{m.customer_next_title()}</h2>
	{#if openFollowUp}
		<p class="flex flex-wrap items-baseline gap-x-2 gap-y-1">
			<span class="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] num">
				{formatDate(openFollowUp.dueDate, locale, 'short')}
			</span>
			<span class="text-sm font-semibold {dueTone}">{dueText}</span>
		</p>
		{#if autoCaption}
			<p class="text-ui leading-4 text-muted-foreground">
				<span class="md:hidden">{m.customer_next_auto_short({ lead: rules.leadDays })}</span>
				<span class="max-md:hidden">{autoCaption}</span>
			</p>
		{/if}
	{:else}
		<p class="text-sm leading-[18px] text-muted-foreground">{m.customer_next_none()}</p>
		<div>
			<Button
				variant="default"
				class="h-9 rounded-lg px-3.5 text-ui font-semibold"
				onclick={() => (scheduleOpen = true)}
			>
				{m.customer_schedule()}
			</Button>
		</div>
	{/if}
</div>
{#if panelItem}
	{#key panelItem.followUpId}
		<FollowUpOutcome item={panelItem} {today} {rules} />
		<FollowUpSnooze followUpId={panelItem.followUpId} {today} />
	{/key}
{/if}

{#if !openFollowUp}
	<ResponsiveDialog bind:open={scheduleOpen} title={m.customer_schedule_title()}>
		<form
			id="customer-schedule-form"
			method="post"
			action="?/schedule"
			use:enhance={scheduleAction.enhance}
			class="space-y-1.5"
		>
			<input type="hidden" name="customerId" value={customerId} />
			<Label for="schedule-date" class="text-ui leading-4 font-semibold"
				>{m.customer_schedule_date()}</Label
			>
			<Input
				id="schedule-date"
				name="dueDate"
				type="date"
				required
				min={today}
				value={addDays(today, rules.retryDays)}
				class="h-11 text-base num md:h-10 md:text-sm desk:h-10"
			/>
			<p class="text-xs leading-4 text-muted-foreground">{m.customer_schedule_helper()}</p>
			{#if scheduleDateError}
				<p class="text-sm text-destructive">{scheduleDateError}</p>
			{/if}
			{#if scheduleConflict}
				<p class="text-sm text-destructive">{m.customer_schedule_exists()}</p>
			{/if}
		</form>
		{#snippet footer()}
			<div class="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
				<Button
					variant="outline"
					type="button"
					class="h-12 w-full text-sm font-semibold md:h-10 md:w-auto md:text-ui desk:h-10"
					onclick={() => (scheduleOpen = false)}
				>
					{m.cancel()}
				</Button>
				<Button
					type="submit"
					form="customer-schedule-form"
					disabled={scheduleAction.pending}
					class="h-12 w-full text-sm font-semibold md:h-10 md:w-auto md:text-ui desk:h-10"
				>
					{m.customer_schedule()}
				</Button>
			</div>
		{/snippet}
	</ResponsiveDialog>
{/if}
