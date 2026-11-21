<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { tick } from 'svelte';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { TEMPLATE_PLACEHOLDERS, type TemplatePlaceholder } from '#lib/domain/template.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { fieldLabel } from '#lib/styles.ts';

	let {
		id,
		name,
		value = $bindable(''),
		error,
		sample
	}: {
		id: string;
		name: string;
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

	// The preview bolds each filled-in value, so the split keeps the placeholders as their own parts.
	const SPLIT = new RegExp(`(\\{(?:${TEMPLATE_PLACEHOLDERS.join('|')})\\})`);
	const parts = $derived(
		value
			.split(SPLIT)
			.filter((p) => p !== '')
			.map((p) => {
				const key = p.slice(1, -1) as TemplatePlaceholder;
				return SPLIT.test(p) && key in sample
					? { text: sample[key], filled: true }
					: { text: p, filled: false };
			})
	);
</script>

<div class="flex flex-col gap-3.5">
	<div class="flex flex-wrap gap-2">
		{#each TEMPLATE_PLACEHOLDERS as ph (ph)}
			<button
				type="button"
				class="inline-flex h-11 items-center rounded-lg border border-border bg-card px-3.5 font-mono text-[13px] font-semibold text-accent-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring desk:h-[34px]"
				aria-label={m.settings_insert({ name: `{${ph}}` })}
				onclick={() => insert(ph)}
			>
				+ {`{${ph}}`}
			</button>
		{/each}
	</div>

	<!-- Desktop: the field and a 300px WhatsApp-style preview side by side. -->
	<div class="flex flex-col gap-4 xl:flex-row">
		<div class="flex min-w-0 flex-1 flex-col gap-1.5">
			<Label for={id} class={fieldLabel}>{m.settings_template_body()}</Label>
			<Textarea
				{id}
				{name}
				rows={6}
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
				class="min-h-[168px] rounded-lg p-3 text-base leading-[22px] md:text-[15px]"
			/>
			<FieldError message={error} />
		</div>

		<div class="flex shrink-0 flex-col gap-1.5 xl:w-[300px]">
			<span class={fieldLabel}>{m.settings_template_preview()}</span>
			<div class="min-h-24 rounded-[10px] bg-background p-3.5">
				<div
					class="rounded-[10px_10px_10px_3px] bg-wa-bubble px-3 pt-2.5 pb-1.5 text-sm leading-5 break-words whitespace-pre-line"
				>
					<!-- Text fragments can repeat, so the index is the only stable key. -->
					{#each parts as part, i (i)}{#if part.filled}<b>{part.text}</b
							>{:else}{part.text}{/if}{:else}—{/each}
					<div class="mt-0.5 text-right text-[11.5px] text-muted-foreground num" aria-hidden="true">
						{m.settings_template_preview_time()}
					</div>
				</div>
			</div>
			<span class="text-[12.5px] text-muted-foreground">
				{m.settings_template_sample({ name: sample.nama })}
			</span>
		</div>
	</div>
</div>
