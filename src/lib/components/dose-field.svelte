<script lang="ts">
	import { tick } from 'svelte';
	import DoseChips from '#lib/components/dose-chips.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
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
		error = null
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
	} = $props();

	async function choose(opt: DoseOption) {
		onselect(opt);
		if (opt !== 'other') return;
		await tick();
		document.getElementById(`${idPrefix}-dose-other`)?.focus();
	}
</script>

<fieldset class="space-y-1.5" aria-describedby="{idPrefix}-dose-hint">
	<legend class={fieldLabel}>{m.dose_per_day()}</legend>
	<p id="{idPrefix}-dose-hint" class="text-ui text-muted-foreground">{m.dose_per_day_hint()}</p>
	<div class="space-y-2 pt-0.5">
		<DoseChips {name} {selected} onselect={choose} />
		{#if selected === 'other'}
			<Input
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
				class="num"
			/>
		{/if}
	</div>
	<FieldError message={error} />
</fieldset>
