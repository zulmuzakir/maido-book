<script module lang="ts">
	const PRESETS = ['1', '2', '3'] as const;

	/** Dose per day from the picked chip and the "other" input; null while it is not a whole ≥ 1. */
	export function doseOf(preset: string, other: unknown): number | null {
		const n = preset === 'other' ? Number(other) : Number(preset);
		return Number.isInteger(n) && n >= 1 ? n : null;
	}

	/** The dose a stored or returned `dosePerDay` value stands for. */
	export const seedDose = (dosePerDay: string | undefined) =>
		doseOf(dosePerDay ?? '1', dosePerDay ?? '');

	/** The field shows +62 as a fixed prefix, so a stored or typed "0812…" drops its leading 0. */
	export const national = (p: string | undefined) => (p ?? '').trim().replace(/^(\+?62|0)\s*/, '');
</script>

<script lang="ts">
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
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { slide } from 'svelte/transition';

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

	// Seeded from `values` (saved data, or what a failed save sent back); typing overrides until the
	// next `values`. The live* props mirror what is typed for the preview beside the form; they are
	// written in the input handlers, not synced in effects.
	let name = $derived(values.name ?? '');
	let phone = $derived(national(values.phone));

	const dose = $derived(values.dosePerDay ?? '1');
	const isPreset = $derived((PRESETS as readonly string[]).includes(dose));

	// The user's own pick wins until new `values` arrive; otherwise the saved or returned dose decides.
	let picked = $derived.by<string | null>(() => {
		void values;
		return null;
	});
	const preset = $derived(picked ?? (isPreset ? dose : 'other'));
	let otherDose = $derived<string | number | null>(isPreset ? '' : dose);

	function setName(v: string) {
		name = v;
		liveName = v;
	}
	function setPhone(v: string) {
		phone = v;
		livePhone = v;
	}
	function pickDose(opt: string) {
		picked = opt;
		liveDose = doseOf(opt, otherDose);
	}
	function setOtherDose(v: string | number | null | undefined) {
		otherDose = v ?? null;
		liveDose = doseOf(preset, otherDose);
	}
</script>

<div class="flex flex-col gap-[18px]">
	<div class={fieldStack}>
		<Label for="{idPrefix}-name" class={fieldLabel}>{m.customer_form_name()}</Label>
		<Input
			id="{idPrefix}-name"
			name="name"
			bind:value={() => name, setName}
			placeholder={m.customer_form_name_placeholder()}
			required
			maxlength={100}
			autocomplete="off"
			aria-invalid={errors.name ? 'true' : undefined}
			aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
			class="text-base desk:h-11 desk:text-[15px]"
		/>
		<FieldError
			id="{idPrefix}-name-error"
			message={errors.name ? fieldError('name', errors.name) : null}
		/>
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
				bind:value={() => phone, setPhone}
				required
				aria-invalid={errors.phone || duplicateOf ? 'true' : undefined}
				aria-describedby={duplicateOf
					? `${idPrefix}-phone-error`
					: errors.phone
						? `${idPrefix}-phone-hint ${idPrefix}-phone-error`
						: `${idPrefix}-phone-hint`}
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
			<!-- Slides open here: the FieldError inside mounts with this block, so its own
			     (local) transition does not run. -->
			<p
				class="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-ui text-destructive"
				in:slide={{ duration: motionMs(DURATION.fast), easing: EASE }}
			>
				<FieldError
					id="{idPrefix}-phone-error"
					message={m.customer_duplicate({ name: duplicateOf.name })}
				/>
				<a
					href={resolve('/(app)/customers/[id]', { id: duplicateOf.id })}
					class="font-semibold text-primary-text underline-offset-4 hover:underline xl:hidden"
				>
					{m.customer_duplicate_open()}
				</a>
			</p>
		{:else if errors.phone}
			<FieldError id="{idPrefix}-phone-error" message={fieldError('phone', errors.phone)} />
		{/if}
	</div>

	<DoseField
		{idPrefix}
		name="dosePreset"
		selected={preset}
		onselect={pickDose}
		bind:otherValue={() => otherDose, setOtherDose}
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
			aria-invalid={errors.notes ? 'true' : undefined}
			aria-describedby={errors.notes ? `${idPrefix}-notes-error` : undefined}
			class="field-sizing-fixed h-24 resize-none py-2.5 text-base leading-[22px] desk:text-[15px]"
		/>
		<FieldError
			id="{idPrefix}-notes-error"
			message={errors.notes ? fieldError('notes', errors.notes) : null}
		/>
	</div>
</div>
