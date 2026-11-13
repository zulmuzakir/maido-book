<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import type { ManualOutcome, RuleSettings } from '#lib/domain/types.ts';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { outcomeLabel } from '#lib/labels.ts';
	import { UNDO_MS, undoFollowUp } from '#lib/follow-up-undo.ts';
	import type { QueueRowItem } from '#lib/queue.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		item,
		today,
		rules,
		choice = $bindable(null),
		saved = false,
		onsaved,
		onundo
	}: {
		item: QueueRowItem;
		today: string;
		rules: RuleSettings;
		/** The picked result. The card hides its message and snooze sections while one is picked. */
		choice?: ManualOutcome | null;
		/** The outcome is already saved: the grid stays for reference, but no result can be picked. */
		saved?: boolean;
		/** Reports a successful save so the page keeps this customer open. */
		onsaved?: (result: { nextFollowUpId: string | null }) => void;
		/** Runs when the user undoes the save from the toast. */
		onundo?: () => void;
	} = $props();

	const locale = $derived(getLocale());
	const OPTIONS: ManualOutcome[] = ['no_reply', 'replied', 'interested', 'not_interested'];
	const DATE_OFFSETS = [2, 3, 7];
	const cellClass =
		'flex min-h-[38px] items-center justify-center rounded-lg border border-rule bg-card px-2 py-1.5 text-center text-ui leading-tight font-semibold text-foreground transition-colors hover:bg-muted';

	let nextDate = $state(untrack(() => addDays(today, rules.retryDays)));
	let errors = $state<Record<string, string>>({});

	const lastAttempt = $derived(item.attempt >= rules.maxAttempts);
	const showDate = $derived(
		choice === 'replied' || choice === 'interested' || (choice === 'no_reply' && !lastAttempt)
	);
	const minDate = $derived(addDays(today, 1));

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

	const save = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') {
			const { nextDate: savedDate, undo: u } = result.data ?? {};
			toast.success(
				savedDate
					? m.today_outcome_saved_next({ date: formatDate(savedDate, locale, 'short') })
					: m.today_outcome_saved(),
				{
					duration: UNDO_MS,
					position: 'bottom-center',
					icon: null,
					action: {
						label: m.undo(),
						onClick: () => {
							undoFollowUp('undoOutcome', u);
							onundo?.();
						}
					}
				}
			);
			choice = null;
			onsaved?.({ nextFollowUpId: u?.nextFollowUpId ?? null });
			await update();
		} else if (result.type === 'failure') {
			errors = (result.data?.errors as Record<string, string> | undefined) ?? {};
			await update({ reset: false });
		} else await update();
	});
</script>

<form
	method="post"
	action="?/outcome"
	use:enhance={save.enhance}
	class="flex flex-col gap-2 border-t border-rule px-5 py-4"
>
	<input type="hidden" name="followUpId" value={item.followUpId} />
	<h3 class="text-ui font-semibold text-foreground">{m.today_outcome_choice()}</h3>

	<div class="grid grid-cols-2 gap-2">
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			href={resolve('/(app)/orders/new') + `?customer=${item.customer.id}`}
			class={cn(cellClass, 'text-status-done')}>{m.card_outcome_ordered()}</a
		>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{#each OPTIONS as o (o)}
			<label
				inert={saved}
				class={cn(
					cellClass,
					choice === o && 'border-[1.5px] border-primary bg-accent text-primary-text'
				)}
			>
				<input type="radio" name="outcome" value={o} bind:group={choice} class="sr-only" />
				{outcomeLabel(o)}
			</label>
		{/each}
	</div>
	<FieldError message={errors.outcome} />

	{#if choice}
		{@const hint = hintFor(choice)}
		{#if hint}
			<p
				class={cn(
					'rounded-[8px] px-3.5 py-3 text-ui leading-[19px]',
					choice === 'no_reply' && lastAttempt
						? 'bg-warning text-warning-foreground'
						: 'bg-subtle text-subtle-foreground'
				)}
			>
				{hint}
			</p>
		{/if}

		{#if showDate}
			<div class="flex flex-col gap-2">
				<label for="next-date-{item.followUpId}" class="text-ui font-semibold text-foreground">
					{m.today_next_date()}
				</label>
				<div class="flex flex-wrap gap-2">
					{#each DATE_OFFSETS as n (n)}
						{@const target = addDays(today, n)}
						<Button
							type="button"
							size="sm"
							variant={nextDate === target ? 'default' : 'secondary'}
							class="h-[36px] rounded-lg px-[14px]"
							aria-pressed={nextDate === target}
							onclick={() => (nextDate = target)}
						>
							{m.today_plus_days({ count: n })}
						</Button>
					{/each}
				</div>
				<div
					class="relative flex h-[40px] items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm"
				>
					<CalendarIcon class="size-4 text-muted-foreground" aria-hidden="true" />
					<span class="num">{nextDate ? formatDate(nextDate, locale, 'long') : ''}</span>
					<input
						id="next-date-{item.followUpId}"
						type="date"
						name="nextDate"
						bind:value={nextDate}
						min={minDate}
						aria-invalid={errors.nextDate ? true : undefined}
						class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
					/>
				</div>
				<FieldError message={errors.nextDate} />
			</div>
		{/if}

		<div class="flex flex-col gap-1.5">
			<label for="note-{item.followUpId}" class="text-ui font-semibold text-foreground">
				{m.today_note_label()}
			</label>
			<Textarea
				id="note-{item.followUpId}"
				name="note"
				rows={2}
				maxlength={1000}
				placeholder={m.today_note_placeholder()}
				class="min-h-[56px] border-rule px-[12px] py-[10px] text-base md:text-sm"
			/>
		</div>

		<div class="flex gap-2">
			<Button
				type="submit"
				class="h-11 px-[14px] text-ui font-semibold desk:h-11"
				disabled={save.pending}
			>
				{m.today_outcome_save()}
			</Button>
			<Button
				type="button"
				variant="outline"
				class="h-11 px-[14px] text-ui font-semibold desk:h-11"
				onclick={() => (choice = null)}
			>
				{m.cancel()}
			</Button>
		</div>
	{/if}
</form>
