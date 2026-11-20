<script lang="ts">
	import { untrack } from 'svelte';
	import { resolve } from '$app/paths';
	import DoseField from '#lib/components/dose-field.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { fieldLabel, fieldStack } from '#lib/styles.ts';

	let {
		values,
		errors = {},
		duplicateOf = null,
		idPrefix = 'customer',
		liveName = $bindable(''),
		livePhone = $bindable(''),
		liveDose = $bindable<number | null>(1)
	}: {
		values: Record<string, string | undefined>;
		errors?: Record<string, string | undefined>;
		duplicateOf?: { id: string; name: string } | null;
		idPrefix?: string;
		/** What is typed right now, for a live preview beside the form. */
		liveName?: string;
		livePhone?: string;
		liveDose?: number | null;
	} = $props();

	// The field shows +62 as a fixed prefix, so a stored or typed "0812…" drops its leading 0.
	const national = (p: string | undefined) => (p ?? '').trim().replace(/^(\+?62|0)\s*/, '');
	let name = $state(untrack(() => values.name ?? ''));
	let phone = $state(untrack(() => national(values.phone)));
	// A failed save hands back what was sent; show that.
	$effect(() => {
		name = values.name ?? '';
		phone = national(values.phone);
	});
	$effect(() => {
		liveName = name;
		livePhone = phone;
	});

	const PRESETS = ['1', '2', '3'] as const;

	const dose = $derived(values.dosePerDay ?? '1');
	const isPreset = $derived((PRESETS as readonly string[]).includes(dose));

	// The user's own pick wins; otherwise the saved or returned dose decides.
	let picked = $state<string | null>(null);
	const preset = $derived(picked ?? (isPreset ? dose : 'other'));
	let otherDose = $state<string | number | null>(untrack(() => (isPreset ? '' : dose)));
	$effect(() => {
		const n = preset === 'other' ? Number(otherDose) : Number(preset);
		liveDose = Number.isInteger(n) && n >= 1 ? n : null;
	});
</script>

<div class="space-y-[22px]">
	<div class={fieldStack}>
		<Label for="{idPrefix}-name" class={fieldLabel}>{m.customer_form_name()}</Label>
		<Input
			id="{idPrefix}-name"
			name="name"
			bind:value={name}
			placeholder={m.customer_form_name_placeholder()}
			required
			maxlength={100}
			autocomplete="off"
			aria-invalid={errors.name ? 'true' : undefined}
			class="text-base desk:h-11 desk:text-[15px]"
		/>
		<FieldError message={errors.name ? fieldError('name', errors.name) : null} />
	</div>

	<div class={fieldStack}>
		<Label for="{idPrefix}-phone" class={fieldLabel}>{m.customer_form_phone()}</Label>
		<InputGroup.Root
			class="h-11 overflow-hidden rounded-lg shadow-none has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-alert desk:h-11"
		>
			<InputGroup.Addon
				align="inline-start"
				class="h-full border-r border-rule bg-background px-3 text-sm font-semibold text-muted-foreground num"
			>
				+62
			</InputGroup.Addon>
			<InputGroup.Input
				id="{idPrefix}-phone"
				name="phone"
				type="tel"
				inputmode="tel"
				autocomplete="tel-national"
				placeholder={m.customer_form_phone_placeholder()}
				bind:value={phone}
				required
				aria-invalid={errors.phone || duplicateOf ? 'true' : undefined}
				aria-describedby="{idPrefix}-phone-hint"
				class="pl-3 text-base num desk:text-[15px]"
			/>
		</InputGroup.Root>
		{#if !duplicateOf}
			<p id="{idPrefix}-phone-hint" class="text-ui text-muted-foreground">
				{m.customer_form_phone_hint()}
			</p>
		{/if}
		{#if duplicateOf}
			<!-- Desktop shows the existing customer in the side panel; smaller screens link inline. -->
			<p class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ui text-destructive">
				<FieldError message={m.customer_duplicate({ name: duplicateOf.name })} />
				<a
					href={resolve('/(app)/customers/[id]', { id: duplicateOf.id })}
					class="font-semibold text-primary-text underline-offset-4 hover:underline xl:hidden"
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
			class="field-sizing-fixed h-24 resize-none py-2.5 text-base leading-[22px] desk:text-[15px]"
		/>
		<FieldError message={errors.notes ? fieldError('notes', errors.notes) : null} />
	</div>
</div>
