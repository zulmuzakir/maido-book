<script module lang="ts">
	import type { ManualOutcome as Outcome } from '#lib/domain/types.ts';

	/** What the card shows once an outcome is saved: the result and when the customer comes back. */
	export interface SavedOutcome {
		nextFollowUpId: string | null;
		outcome: Outcome;
		nextDate: string | null;
	}
</script>

<script lang="ts">
	import DateField from '#lib/components/date-field.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import CheckIcon from '@lucide/svelte/icons/check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import type { ManualOutcome, RuleSettings } from '#lib/domain/types.ts';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { fieldError, outcomeLabel } from '#lib/labels.ts';
	import { UNDO_MS, undoFollowUp } from '#lib/follow-up-undo.ts';
	import type { QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { dateChip } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';

	let {
		item,
		today,
		rules,
		choice = $bindable(null),
		onsaved,
		onundo
	}: {
		item: QueueRowItem;
		today: string;
		rules: RuleSettings;
		/** The picked result. The card hides its message and snooze while one is picked. */
		choice?: ManualOutcome | null;
		/** Reports a successful save so the page keeps this customer open. */
		onsaved?: (result: SavedOutcome) => void;
		/** Runs once an undo from the toast has finished and the customer is back in the queue. */
		onundo?: () => void;
	} = $props();

	const locale = $derived(getLocale());
	// The order the boards list them in; "Sudah order" (a link to the order form) comes first.
	const OPTIONS: ManualOutcome[] = ['replied', 'interested', 'no_reply', 'not_interested'];
	// Next-contact chips: the retry window, then +3 and +7 days.
	const DATE_OFFSETS = $derived(
		[...new Set([rules.retryDays, 3, 7])].filter((n) => n > 0).sort((a, b) => a - b)
	);
	/** Berminat comes back sooner than a plain reply: +3 days; everything else uses the retry window. */
	const defaultOffset = (o: ManualOutcome | null) => (o === 'interested' ? 3 : rules.retryDays);
	const optionClass =
		'flex h-[46px] w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3.5 text-left text-sm font-semibold text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring';

	let nextDate = $state(untrack(() => addDays(today, rules.retryDays)));
	let errors = $state<Record<string, string>>({});
	// Each pick starts from its own default date (set in the radio's change handler).
	function pick(o: ManualOutcome) {
		nextDate = addDays(today, defaultOffset(o));
	}
	const chipDates = $derived(DATE_OFFSETS.map((n) => addDays(today, n)));
	// A ToggleGroup clears its value when the chosen chip is clicked again; keep the date instead.
	function pickDate(v: string) {
		if (v) nextDate = v;
	}

	const lastAttempt = $derived(item.attempt >= rules.maxAttempts);
	const showDate = $derived(
		choice === 'replied' || choice === 'interested' || (choice === 'no_reply' && !lastAttempt)
	);
	const minDate = $derived(addDays(today, 1));
	const warn = $derived(choice === 'no_reply' && lastAttempt);

	function hintFor(o: ManualOutcome): string | null {
		if (o === 'interested') return m.today_interested_hint();
		if (o === 'not_interested') return m.today_not_interested_info();
		if (o === 'no_reply') {
			return lastAttempt
				? m.today_last_attempt({
						date: formatDate(addDays(today, rules.winbackDays), locale, 'short')
					})
				: m.today_attempt_info({ attempt: item.attempt, max: rules.maxAttempts });
		}
		return null;
	}

	const save = new FormAction(async ({ result, update, formData }) => {
		if (result.type === 'success') {
			const picked = String(formData.get('outcome') ?? '') as ManualOutcome;
			const { nextDate: savedDate, undo: u } = result.data ?? {};
			toast.success(
				savedDate
					? m.today_outcome_saved_next({ date: formatDate(savedDate, locale, 'short') })
					: m.today_outcome_saved(),
				{
					duration: UNDO_MS,
					icon: null,
					action: {
						label: m.undo(),
						// Wait for the reload, so the restored customer is back in the list before the page
						// lets go of the saved card; otherwise the selection jumps to a neighbour.
						onClick: async () => {
							await undoFollowUp('undoOutcome', u);
							onundo?.();
						}
					}
				}
			);
			choice = null;
			onsaved?.({
				nextFollowUpId: u?.nextFollowUpId ?? null,
				outcome: picked,
				nextDate: savedDate ?? null
			});
			await update();
		} else if (result.type === 'failure') {
			errors = (result.data?.errors as Record<string, string> | undefined) ?? {};
			await update({ reset: false });
		} else await update();
	});
</script>

<form method="post" action="?/outcome" use:enhance={save.enhance} class="flex flex-col">
	<input type="hidden" name="followUpId" value={item.followUpId} />
	<fieldset class="flex flex-col gap-3 border-t border-rule px-6 py-[18px]">
		<legend class="float-left mb-3 text-ui font-semibold text-foreground">
			{m.today_outcome_choice()}
		</legend>
		<!-- Tablet (the 480px sheet): two columns until a result is picked, then one, as on the boards. -->
		<div
			class={cn(
				'clear-left flex flex-col gap-2',
				choice === null && 'md:grid md:grid-cols-2 xl:flex'
			)}
		>
			<!-- eslint-disable svelte/no-navigation-without-resolve -->
			<a
				href={resolve('/(app)/orders/new') + `?customer=${item.customer.id}&from=queue`}
				class={optionClass}
				>{m.card_outcome_ordered()}<ArrowUpRightIcon
					class="size-4 text-muted-foreground"
					aria-hidden="true"
				/></a
			>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{#each OPTIONS as o (o)}
				<label
					class={cn(
						optionClass,
						choice === o &&
							'border-primary bg-accent text-accent-foreground shadow-[inset_0_0_0_1px_var(--primary)] hover:bg-accent'
					)}
				>
					<input
						type="radio"
						name="outcome"
						value={o}
						bind:group={choice}
						onchange={() => pick(o)}
						class="sr-only"
					/>
					{outcomeLabel(o)}
					{#if choice === o}<CheckIcon class="size-[18px]" aria-hidden="true" />{/if}
				</label>
			{/each}
		</div>
		<FieldError message={fieldError('outcome', errors.outcome)} />
	</fieldset>

	{#if choice}
		{@const hint = hintFor(choice)}
		<div class="flex flex-col gap-3 border-t border-rule px-6 py-[18px]">
			{#if hint}
				<p
					class={cn(
						'flex items-start gap-2.5 rounded-[8px] px-3.5 py-3 text-sm leading-[21px] text-foreground',
						warn ? 'bg-note' : 'bg-surface-inset'
					)}
				>
					{#if warn}
						<TriangleAlertIcon
							class="mt-0.5 size-4 shrink-0 text-status-today"
							aria-hidden="true"
						/>
					{:else}
						<InfoIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
					{/if}
					<span class="flex-1">{hint}</span>
				</p>
			{/if}

			{#if showDate}
				<div class="flex flex-col gap-2">
					<label for="next-date-{item.followUpId}" class="text-ui font-semibold text-foreground">
						{m.today_next_date()}
					</label>
					<ToggleGroup.Root
						type="single"
						spacing={2}
						aria-label={m.today_next_date()}
						class="flex-wrap"
						bind:value={() => (chipDates.includes(nextDate) ? nextDate : ''), pickDate}
					>
						{#each DATE_OFFSETS as n (n)}
							<ToggleGroup.Item value={addDays(today, n)} class={dateChip}>
								{m.today_plus_days({ count: n })}
							</ToggleGroup.Item>
						{/each}
					</ToggleGroup.Root>
					<DateField
						id="next-date-{item.followUpId}"
						name="nextDate"
						bind:value={nextDate}
						min={minDate}
						invalid={!!errors.nextDate}
						describedby={errors.nextDate ? `next-date-${item.followUpId}-error` : undefined}
					/>
					<FieldError
						id="next-date-{item.followUpId}-error"
						message={fieldError('nextDate', errors.nextDate)}
					/>
				</div>
			{/if}

			<div class="flex flex-col gap-1.5">
				<label for="note-{item.followUpId}" class="text-ui font-semibold text-foreground">
					{m.today_note_title()}
					<span class="font-normal text-muted-foreground">{m.optional().toLowerCase()}</span>
				</label>
				<Textarea
					id="note-{item.followUpId}"
					name="note"
					rows={2}
					maxlength={1000}
					placeholder={m.today_note_placeholder()}
					class="h-[72px] min-h-0 resize-none px-3 py-2.5 text-base desk:text-[15px]"
				/>
			</div>
		</div>

		<!-- Pinned to the bottom of the panel (or sheet) while the result is being filled in. -->
		<div
			class="sticky bottom-0 z-10 flex gap-2 border-t border-rule bg-card px-6 py-3.5 shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)]"
		>
			<Button type="submit" class="h-11 flex-1 desk:h-11" disabled={save.pending}>
				{m.today_outcome_save()}
			</Button>
			<Button
				type="button"
				variant="outline"
				class="h-11 w-[100px] desk:h-11"
				onclick={() => (choice = null)}
			>
				{m.cancel()}
			</Button>
		</div>
	{/if}
</form>
