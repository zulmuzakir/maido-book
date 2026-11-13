<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { tick } from 'svelte';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { renderTemplate, TEMPLATE_PLACEHOLDERS } from '#lib/domain/template.ts';
	import { m } from '#lib/paraglide/messages.js';

	let {
		id,
		name,
		label,
		value = $bindable(''),
		error,
		sample
	}: {
		id: string;
		name: string;
		label: string;
		value: string;
		error?: string;
		sample: { nama: string; produk: string; cs: string };
	} = $props();

	let ref: HTMLTextAreaElement | null = $state(null);
	// Last known caret; null until the user has touched the field.
	let selection: { start: number; end: number } | null = null;

	function track() {
		if (!ref) return;
		selection = { start: ref.selectionStart, end: ref.selectionEnd };
	}

	async function insert(placeholder: string) {
		const text = `{${placeholder}}`;
		const start = Math.min(selection?.start ?? value.length, value.length);
		const end = Math.min(selection?.end ?? value.length, value.length);
		value = value.slice(0, start) + text + value.slice(end);
		const caret = start + text.length;
		selection = { start: caret, end: caret };
		await tick();
		ref?.focus();
		ref?.setSelectionRange(caret, caret);
	}

	const preview = $derived(renderTemplate(value, sample));
</script>

<div class="space-y-2">
	<Label for={id} class="text-ui leading-4 font-semibold">{label}</Label>

	<Textarea
		{id}
		{name}
		rows={3}
		maxlength={1000}
		bind:value
		bind:ref
		aria-invalid={!!error}
		onselect={track}
		onkeyup={track}
		onclick={track}
		oninput={track}
		onfocus={track}
		onblur={track}
		class="rounded-[8px] border-rule p-3.5 text-base leading-[21px] text-subtle-foreground md:text-sm"
	/>
	<FieldError message={error} />

	<div class="flex flex-wrap gap-1.5">
		{#each TEMPLATE_PLACEHOLDERS as ph (ph)}
			<button
				type="button"
				class="inline-flex items-center rounded-[4px] bg-secondary px-2 py-1 text-xs leading-4 font-semibold text-secondary-foreground num dark:text-muted-foreground"
				onclick={() => insert(ph)}
			>
				{m.settings_insert({ name: `{${ph}}` })}
			</button>
		{/each}
	</div>

	<div class="space-y-1 rounded-[8px] bg-subtle px-3.5 py-3">
		<p class="text-xs font-semibold text-muted-foreground">{m.settings_template_preview()}</p>
		<blockquote
			class="text-ui leading-[19px] break-words whitespace-pre-line text-subtle-foreground"
		>
			{preview || '—'}
		</blockquote>
	</div>
</div>
