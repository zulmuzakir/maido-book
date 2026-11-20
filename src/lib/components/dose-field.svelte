<script lang="ts">
	import { tick } from 'svelte';
	import DoseChips from '#lib/components/dose-chips.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { fieldLabel } from '#lib/styles.ts';

	type DoseOption = '1' | '2' | '3' | 'other';

	let {
		idPrefix,
		name,
		selected,
		onselect,
		otherValue = $bindable(),
		otherName,
		error = null,
		hint = true
	}: {
		idPrefix: string;
		/** Radio group name for the 1×/2×/3×/other chips. */
		name: string;
		selected: string;
		onselect: (opt: DoseOption) => void;
		otherValue?: string | number | null;
		/** Posts the "other" input under this name; without it the caller posts the dose itself. */
		otherName?: string;
		error?: string | null;
		/** The "used to work out when stock runs out" line; the order form leaves it out. */
		hint?: boolean;
	} = $props();

	async function choose(opt: DoseOption) {
		onselect(opt);
		if (opt !== 'other') return;
		await tick();
		document.getElementById(`${idPrefix}-dose-other`)?.focus();
	}
</script>

{#snippet otherInput()}
	<!-- "Lainnya" opens a small "4 ×/hari" input in the row's fifth slot. -->
	<label
		class="flex h-11 min-w-0 items-center gap-1 rounded-lg border border-primary bg-card px-3 shadow-[inset_0_0_0_1px_var(--primary)] has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring has-[[aria-invalid]]:border-destructive has-[[aria-invalid]]:shadow-none"
	>
		<input
			id="{idPrefix}-dose-other"
			name={otherName}
			type="number"
			inputmode="numeric"
			min={1}
			max={20}
			step={1}
			bind:value={otherValue}
			aria-label={m.dose_per_day()}
			aria-invalid={error ? 'true' : undefined}
			class="h-full w-full min-w-0 [appearance:textfield] border-0 bg-transparent p-0 text-[15px] font-bold num shadow-none outline-none [&::-webkit-inner-spin-button]:appearance-none"
		/>
		<span class="shrink-0 text-xs text-muted-foreground" aria-hidden="true"
			>{m.dose_per_day_suffix()}</span
		>
	</label>
{/snippet}

<fieldset class="space-y-1.5" aria-describedby={hint ? `${idPrefix}-dose-hint` : undefined}>
	<legend class={fieldLabel}>{m.dose_per_day()}</legend>
	{#if hint}
		<p id="{idPrefix}-dose-hint" class="text-ui text-muted-foreground">{m.dose_per_day_hint()}</p>
	{/if}
	<div class="pt-0.5">
		<DoseChips
			{name}
			{selected}
			onselect={choose}
			extra={selected === 'other' ? otherInput : undefined}
		/>
	</div>
	<FieldError message={error} />
</fieldset>
