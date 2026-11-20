<script lang="ts">
	import Upload from '@lucide/svelte/icons/upload';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import type { ReadProblem } from './import-model.ts';

	let {
		reading,
		problem,
		onfile
	}: {
		reading: boolean;
		problem: ReadProblem | null;
		onfile: (file: File) => void;
	} = $props();

	let dragging = $state(false);

	function onPick(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = '';
		if (file) onfile(file);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files[0];
		if (file) onfile(file);
	}
</script>

<section class="w-full max-w-[704px] space-y-[18px] md:space-y-5">
	{#if !problem}
		<p class="text-sm leading-[21px] text-muted-foreground">{m.import_intro()}</p>
	{/if}
	{#if problem}
		<div
			role="alert"
			class="rounded-[8px] border border-alert-border bg-alert px-3.5 py-3 text-ui leading-[19px] text-alert-foreground"
		>
			{#if problem.kind === 'read'}
				{m.import_read_failed()}
			{:else if problem.kind === 'type'}
				{m.import_wrong_type()}
			{:else if problem.kind === 'size'}
				{m.import_too_large()}
			{:else if problem.kind === 'missing'}
				{m.import_missing_columns({
					columns: problem.columns.map((c) => `“${c}”`).join(', '),
					sheet: problem.sheet
				})}
			{:else}
				{m.import_no_rows({ sheet: problem.sheet })}
			{/if}
		</div>
	{/if}
	<label
		class="flex cursor-pointer flex-col items-center gap-3.5 rounded-[8px] border-[1.5px] border-dashed bg-dropzone px-4 py-10 text-center transition-colors focus-within:ring-3 focus-within:ring-ring md:px-6 md:py-14 {problem
			? 'border-destructive'
			: 'border-dropzone-border'} {dragging ? 'border-primary bg-accent' : ''}"
		ondragover={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
	>
		<span class="grid size-12 place-items-center rounded-full bg-secondary text-primary-text">
			<Upload class="size-6" aria-hidden="true" />
		</span>
		<span class="flex flex-col items-center gap-1">
			<span class="text-base leading-5 font-bold">{m.import_drop_title()}</span>
			<span class="max-w-sm text-ui leading-4 text-muted-foreground">{m.import_drop_hint()}</span>
		</span>
		<span
			class={cn(
				buttonVariants({ variant: 'default', size: 'default' }),
				'h-10 gap-1.5 px-3.5 text-ui font-semibold'
			)}
		>
			{reading ? m.import_reading() : m.import_pick()}
		</span>
		<input class="sr-only" type="file" accept=".xlsx" disabled={reading} onchange={onPick} />
	</label>

	{#if !problem}
		<p class="rounded-[8px] bg-subtle px-3.5 py-3 text-ui leading-[19px] text-subtle-foreground">
			{m.import_sheet_note()}
		</p>
	{/if}

	{#if reading}
		<p class="flex items-center gap-2 text-ui text-muted-foreground" role="status">
			<Spinner />
			{m.import_reading()}
		</p>
	{/if}
</section>
