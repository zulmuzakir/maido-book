<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import DoseField from '#lib/components/dose-field.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { fieldLabel, fieldStack } from '#lib/styles.ts';

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

	const dose = $derived(values.dosePerDay ?? '1');
	const isPreset = $derived((PRESETS as readonly string[]).includes(dose));

	// The user's own pick wins; otherwise the saved or returned dose decides.
	let picked = $state<string | null>(null);
	const preset = $derived(picked ?? (isPreset ? dose : 'other'));
	let otherDose = $state<string | number | null>(untrack(() => (isPreset ? '' : dose)));
</script>

<div class="space-y-[18px]">
	<div class={fieldStack}>
		<Label for="{idPrefix}-name" class={fieldLabel}>{m.customer_form_name()}</Label>
		<Input
			id="{idPrefix}-name"
			name="name"
			value={values.name ?? ''}
			placeholder={m.customer_form_name_placeholder()}
			required
			maxlength={100}
			autocomplete="off"
			aria-invalid={errors.name ? 'true' : undefined}
		/>
		<FieldError message={errors.name ? fieldError('name', errors.name) : null} />
	</div>

	<div class={fieldStack}>
		<Label for="{idPrefix}-phone" class={fieldLabel}>{m.customer_form_phone()}</Label>
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
			class="num"
		/>
		{#if !duplicateOf}
			<p id="{idPrefix}-phone-hint" class="text-ui text-muted-foreground">
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

	<DoseField
		{idPrefix}
		name="dosePreset"
		selected={preset}
		onselect={(opt) => (picked = opt)}
		bind:otherValue={otherDose}
		otherName="dosePerDayOther"
		error={errors.dosePerDay ? fieldError('dosePerDay', errors.dosePerDay) : null}
	/>

	<div class={fieldStack}>
		<div class="flex items-baseline gap-1.5">
			<Label for="{idPrefix}-notes" class={fieldLabel}>{m.customer_form_notes()}</Label>
			<span class="text-xs text-muted-foreground">{m.optional()}</span>
		</div>
		<Textarea
			id="{idPrefix}-notes"
			name="notes"
			maxlength={1000}
			placeholder={m.customer_note_placeholder()}
			value={values.notes ?? ''}
			class="field-sizing-fixed h-[88px] py-2.5"
		/>
		<FieldError message={errors.notes ? fieldError('notes', errors.notes) : null} />
	</div>
</div>
