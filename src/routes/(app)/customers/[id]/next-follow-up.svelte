<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import FieldError from '#lib/components/field-error.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import ResponsiveDialog from '#lib/components/responsive-dialog.svelte';
	import { addDays, formatDate, isIsoDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { relativeDue } from '#lib/format.ts';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { dueState } from '#lib/queue.ts';
	import { dateChip } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';
	import type { ActionData, PageData } from './$types';

	let {
		customerId,
		customerName,
		openFollowUp,
		panelItem,
		latest,
		today,
		rules,
		form,
		class: className
	}: {
		customerId: string;
		customerName: string;
		openFollowUp: PageData['openFollowUp'];
		panelItem: PageData['panelItem'];
		latest: PageData['orders'][number] | null;
		today: string;
		rules: PageData['rules'];
		form: ActionData;
		class?: string;
	} = $props();

	const locale = getLocale() === 'id' ? 'id' : 'en';

	const act = $derived(form && 'action' in form ? form.action : null);
	const formErrors = $derived(
		form && 'errors' in form && form.errors ? (form.errors as Record<string, string>) : {}
	);

	// The page's `form` outlives the dialog, so errors show only after a failed submit from this
	// opening of the dialog; reopening starts clean.
	let showErrors = $state(false);
	const scheduleDateError = $derived(
		showErrors && act === 'schedule' ? fieldError('scheduleDate', formErrors.dueDate) : undefined
	);
	const scheduleConflict = $derived(
		showErrors &&
			act === 'schedule' &&
			!!form &&
			!('ok' in form) &&
			Object.keys(formErrors).length === 0
	);
	const dateDescribedBy = $derived(
		[
			'schedule-date-hint',
			scheduleDateError && 'schedule-date-error',
			scheduleConflict && 'schedule-conflict'
		]
			.filter(Boolean)
			.join(' ')
	);

	const newest = $derived(
		latest
			? supplyStatus({ orderDate: latest.orderDate, daysSupply: latest.daysSupply, today })
			: null
	);

	const dueText = $derived(
		openFollowUp
			? panelItem
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
					date: formatDate(newest.runsOutOn, locale, 'short')
				})
			: null
	);
	const queueHref = $derived(
		openFollowUp ? `${resolve('/(app)')}?item=${encodeURIComponent(openFollowUp.id)}` : ''
	);

	/** "Tanty Maryanti · stok habis 44 hari lalu": who, and why it matters now. */
	const scheduleSubtitle = $derived(
		newest
			? `${customerName} · ${
					newest.daysLeft < 0
						? m.customer_header_stock_out({ count: -newest.daysLeft })
						: newest.daysLeft === 0
							? m.stock_out_today()
							: m.stock_days_left({ count: newest.daysLeft })
				}`
			: customerName
	);
	const PRESETS = [1, 3, 7] as const;
	const presetDates = $derived(PRESETS.map((days) => addDays(today, days)));
	// A ToggleGroup clears its value when the chosen chip is clicked again; keep the date instead.
	function pickDate(v: string) {
		if (v) scheduleDate = v;
	}
	let scheduleOpen = $state(false);
	let scheduleDate = $state('');
	const scheduleAction = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') {
			scheduleOpen = false;
			toast.success(m.customer_schedule_saved());
		} else if (result.type === 'failure') showErrors = true;
		await update({ reset: false });
	});

	function openSchedule() {
		scheduleDate = addDays(today, 3);
		showErrors = false;
		scheduleOpen = true;
	}
</script>

<!-- Phone and the desktop aside stack the card; the tablet's full-width card puts the button on
     the right. With nothing scheduled the card is a dashed outline with an outline button. -->
{#if openFollowUp}
	<section
		class={cn(
			'flex flex-col gap-2.5 rounded-[10px] bg-background px-5 py-[18px] shadow-[inset_0_0_0_1px_var(--rule)] md:flex-row md:items-center md:gap-5 xl:flex-col xl:items-stretch xl:gap-3',
			className
		)}
	>
		<div class="flex flex-1 flex-col gap-2">
			<h2 class="text-[13px] leading-4 font-semibold">{m.customer_next_title()}</h2>
			<p class="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
				<span class="text-[32px] leading-none font-bold tracking-[-0.03em] num">
					{formatDate(openFollowUp.dueDate, locale, 'short')}
				</span>
				<span class="text-sm font-semibold lowercase {dueTone}">{dueText}</span>
			</p>
			{#if autoCaption}
				<p class="text-[13.5px] leading-5 text-muted-foreground">{autoCaption}</p>
			{/if}
		</div>
		<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- built from resolve() above -->
		<Button href={queueHref} class="h-11 px-5 font-semibold desk:h-11">
			{m.customer_open_in_queue()}
		</Button>
	</section>
{:else}
	<section
		class={cn(
			'flex flex-col gap-3 rounded-[10px] border border-dashed border-border px-5 py-[18px]',
			className
		)}
	>
		<div class="flex flex-col gap-1.5">
			<h2 class="text-[13px] leading-4 font-semibold">{m.customer_next_title()}</h2>
			<p class="text-[15px] leading-5 text-muted-foreground">{m.customer_next_none()}</p>
		</div>
		<Button variant="outline" class="h-11 font-semibold desk:h-11" onclick={openSchedule}>
			<CalendarIcon class="size-[18px]" aria-hidden="true" />
			{m.customer_schedule()}
		</Button>
	</section>

	<ResponsiveDialog
		bind:open={scheduleOpen}
		title={m.customer_schedule_title()}
		description={scheduleSubtitle}
	>
		<form
			id="customer-schedule-form"
			method="post"
			action="?/schedule"
			use:enhance={scheduleAction.enhance}
			class="flex flex-col gap-2.5 pt-1"
		>
			<input type="hidden" name="customerId" value={customerId} />
			<Label for="schedule-date" class="text-ui leading-4 font-semibold"
				>{m.customer_schedule_date()}</Label
			>
			<ToggleGroup.Root
				type="single"
				spacing={2}
				aria-label={m.customer_schedule_date()}
				bind:value={() => (presetDates.includes(scheduleDate) ? scheduleDate : ''), pickDate}
			>
				{#each PRESETS as days (days)}
					<ToggleGroup.Item value={addDays(today, days)} class={dateChip}>
						{days === 1 ? m.snooze_tomorrow() : m.today_plus_days({ count: days })}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
			<div
				class="relative flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-base has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring desk:text-[15px]"
			>
				<CalendarIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
				<span aria-hidden="true" class="num">
					{isIsoDate(scheduleDate) ? formatDate(scheduleDate, getLocale(), 'long') : ''}
				</span>
				<input
					id="schedule-date"
					name="dueDate"
					type="date"
					required
					min={today}
					bind:value={scheduleDate}
					aria-invalid={scheduleDateError ? 'true' : undefined}
					aria-describedby={dateDescribedBy}
					class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
				/>
			</div>
			<p id="schedule-date-hint" class="text-xs leading-4 text-muted-foreground">
				{m.customer_schedule_helper()}
			</p>
			<FieldError id="schedule-date-error" message={scheduleDateError} />
			<FieldError
				id="schedule-conflict"
				message={scheduleConflict ? m.customer_schedule_exists() : null}
			/>
		</form>
		{#snippet footer()}
			<div class="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
				<Button
					variant="outline"
					type="button"
					class="h-12 w-full text-sm font-semibold md:h-11 md:w-auto desk:h-11"
					onclick={() => (scheduleOpen = false)}
				>
					{m.cancel()}
				</Button>
				<Button
					type="submit"
					form="customer-schedule-form"
					disabled={scheduleAction.pending}
					class="h-12 w-full text-sm font-semibold md:h-11 md:w-auto md:px-5 desk:h-11"
				>
					{m.customer_schedule()}
				</Button>
			</div>
		{/snippet}
	</ResponsiveDialog>
{/if}
