<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { addDays, formatDate } from '#lib/domain/dates.ts';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { UNDO_MS, undoFollowUp } from '#lib/follow-up-undo.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';

	let { followUpId, today }: { followUpId: string; today: string } = $props();

	const locale = $derived(getLocale());
	const minDate = $derived(addDays(today, 1));
	let snoozeDate = $state(untrack(() => addDays(today, 1)));
	let errors = $state<Record<string, string>>({});
	const chipClass = 'h-9 desk:h-9 rounded-lg px-3.5 text-ui font-semibold';

	const snooze = new FormAction(async ({ result, update, formData }) => {
		if (result.type === 'success') {
			const d = String(formData.get('dueDate') ?? '');
			const u = result.data?.undo;
			toast.success(m.today_snoozed({ date: formatDate(d, locale, 'short') }), {
				duration: UNDO_MS,
				action: { label: m.undo(), onClick: () => undoFollowUp('undoSnooze', u) }
			});
			await update();
		} else if (result.type === 'failure') {
			errors = (result.data?.errors as Record<string, string> | undefined) ?? {};
			await update({ reset: false });
		} else await update();
	});
</script>

<section class="flex flex-col gap-2.5 border-t border-rule px-5 py-4">
	<h3 class="text-ui font-semibold text-foreground">{m.card_snooze_label()}</h3>
	<form
		method="post"
		action="?/snooze"
		use:enhance={snooze.enhance}
		class="flex flex-wrap items-center gap-2"
	>
		<input type="hidden" name="followUpId" value={followUpId} />
		<Button
			type="submit"
			name="dueDate"
			value={addDays(today, 1)}
			variant="secondary"
			size="sm"
			class={chipClass}
		>
			{m.snooze_tomorrow()}
		</Button>
		<Button
			type="submit"
			name="dueDate"
			value={addDays(today, 3)}
			variant="secondary"
			size="sm"
			class={chipClass}
		>
			{m.today_plus_days({ count: 3 })}
		</Button>
		<Button
			type="submit"
			name="dueDate"
			value={addDays(today, 7)}
			variant="secondary"
			size="sm"
			class={chipClass}
		>
			{m.today_plus_days({ count: 7 })}
		</Button>
		<Input
			type="date"
			bind:value={snoozeDate}
			min={minDate}
			aria-label={m.today_snooze_date()}
			aria-invalid={errors.dueDate ? true : undefined}
			class="h-10 w-auto rounded-lg border-input px-3 text-base md:text-sm"
		/>
		<Button
			type="submit"
			name="dueDate"
			value={snoozeDate}
			variant="outline"
			size="sm"
			class={chipClass}
			disabled={!snoozeDate || snooze.pending}
		>
			{m.snooze()}
		</Button>
	</form>
	<FieldError message={errors.dueDate} />
</section>
