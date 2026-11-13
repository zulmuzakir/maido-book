<script lang="ts">
	import DoseChips from '#lib/components/dose-chips.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { tick } from 'svelte';
	import { resolve } from '$app/paths';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';

	let {
		values,
		errors = {},
		duplicateOf = null,
		idPrefix = 'customer'
	}: {
		values: Record<string, string | undefined>;
		errors?: Record<string, string | undefined>;
		duplicateOf?: { id: string; name: string } | null;
		idPrefix?: string;
	} = $props();

	const PRESETS = ['1', '2', '3'] as const;
	// Phone keeps 16px text to stop iOS focus zoom; tablet and desktop use the Paper sizes.
	const FIELD = 'h-10 desk:h-10 rounded-lg px-3 text-base leading-[18px] md:text-sm';

	const dose = $derived(values.dosePerDay ?? '1');
	const isPreset = $derived((PRESETS as readonly string[]).includes(dose));

	// The user's own pick wins; otherwise the saved or returned dose decides.
	let picked = $state<string | null>(null);
	const preset = $derived(picked ?? (isPreset ? dose : 'other'));
	const otherDose = $derived(isPreset ? '' : dose);

	async function choose(opt: string) {
		picked = opt;
		if (opt !== 'other') return;
		await tick();
		document.getElementById(`${idPrefix}-dose-other`)?.focus();
	}
</script>

<div class="space-y-[18px]">
	<div class="space-y-1.5">
		<Label for="{idPrefix}-name" class="text-ui font-semibold">{m.customer_form_name()}</Label>
		<Input
			id="{idPrefix}-name"
			name="name"
			value={values.name ?? ''}
			placeholder={m.customer_form_name_placeholder()}
			required
			maxlength={100}
			autocomplete="off"
			aria-invalid={errors.name ? 'true' : undefined}
			class={FIELD}
		/>
		<FieldError message={errors.name ? fieldError('name', errors.name) : null} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-phone" class="text-ui font-semibold">{m.customer_form_phone()}</Label>
		<Input
			id="{idPrefix}-phone"
			name="phone"
			type="tel"
			inputmode="tel"
			autocomplete="tel"
			placeholder={m.customer_form_phone_placeholder()}
			value={values.phone ?? ''}
			required
			aria-invalid={errors.phone || duplicateOf ? 'true' : undefined}
			aria-describedby="{idPrefix}-phone-hint"
			class="num {FIELD}"
		/>
		{#if !duplicateOf}
			<p id="{idPrefix}-phone-hint" class="text-xs text-muted-foreground">
				{m.customer_form_phone_hint()}
			</p>
		{/if}
		{#if duplicateOf}
			<p class="flex flex-wrap items-center gap-2.5 text-ui text-destructive">
				{m.customer_duplicate({ name: duplicateOf.name })}
				<a
					href={resolve('/(app)/customers/[id]', { id: duplicateOf.id })}
					class="font-semibold text-primary-text underline-offset-4 hover:underline"
				>
					{m.customer_duplicate_open()}
				</a>
			</p>
		{:else if errors.phone}
			<FieldError message={fieldError('phone', errors.phone)} />
		{/if}
	</div>

	<fieldset class="flex flex-col gap-2" aria-describedby="{idPrefix}-dose-hint">
		<legend class="text-ui leading-4 font-medium">{m.dose_per_day()}</legend>
		<p id="{idPrefix}-dose-hint" class="text-ui text-muted-foreground">
			{m.customer_form_dose_hint()}
		</p>
		<DoseChips name="dosePreset" selected={preset} onselect={choose} />
		{#if preset === 'other'}
			<Input
				id="{idPrefix}-dose-other"
				name="dosePerDayOther"
				type="number"
				inputmode="numeric"
				min={1}
				max={20}
				step={1}
				value={otherDose}
				aria-label={m.dose_per_day()}
				aria-invalid={errors.dosePerDay ? 'true' : undefined}
				class="num {FIELD}"
			/>
		{/if}
		<FieldError message={errors.dosePerDay ? fieldError('dosePerDay', errors.dosePerDay) : null} />
	</fieldset>

	<div class="space-y-1.5">
		<div class="flex items-baseline gap-1.5">
			<Label for="{idPrefix}-notes" class="text-ui font-semibold">{m.customer_form_notes()}</Label>
			<span class="text-xs text-muted-foreground">{m.customer_form_notes_hint()}</span>
		</div>
		<Textarea
			id="{idPrefix}-notes"
			name="notes"
			maxlength={1000}
			placeholder={m.customer_note_placeholder()}
			value={values.notes ?? ''}
			class="h-[88px] rounded-lg px-3 py-2.5 text-base md:text-sm"
		/>
		<FieldError message={errors.notes ? fieldError('notes', errors.notes) : null} />
	</div>
</div>
