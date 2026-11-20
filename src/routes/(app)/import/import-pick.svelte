<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
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

<section class="flex flex-col gap-5">
	{#if problem}
		<div
			role="alert"
			class="flex items-start gap-2.5 rounded-[8px] bg-alert px-3.5 py-3 text-sm leading-5 text-alert-foreground"
		>
			<TriangleAlert class="mt-0.5 size-4 shrink-0 text-status-overdue" aria-hidden="true" />
			<span>
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
			</span>
		</div>
	{/if}
	<label
		class={cn(
			'flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed px-5 py-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring md:px-6 md:py-14',
			problem
				? 'border-destructive bg-[color-mix(in_oklch,var(--destructive)_4%,var(--card))]'
				: 'border-dropzone-border bg-dropzone',
			dragging && 'border-primary bg-accent'
		)}
		ondragover={(event) => {
			event.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={onDrop}
	>
		<span class="mb-2 grid size-14 place-items-center rounded-full bg-accent text-primary-text">
			<FileText class="size-[26px] md:hidden" aria-hidden="true" />
			<Upload class="hidden size-[26px] md:block" aria-hidden="true" />
		</span>
		<span class="text-[17px] leading-[22px] font-bold">{m.import_drop_title()}</span>
		<span class="max-w-[360px] text-sm leading-[21px] text-muted-foreground">
			<span class="md:hidden">{m.import_drop_hint_phone()}</span>
			<span class="hidden md:inline">{m.import_drop_hint()}</span>
		</span>
		<span
			class={cn(
				buttonVariants({ variant: 'default', size: 'default' }),
				'mt-3.5 h-12 w-full gap-2 px-[22px] text-sm font-semibold md:h-11 md:w-auto desk:h-11'
			)}
		>
			{#if reading}
				<Spinner />
				{m.import_reading()}
			{:else}
				<span class="md:hidden">{m.import_pick_short()}</span>
				<span class="hidden md:inline">{m.import_pick()}</span>
			{/if}
		</span>
		<input class="sr-only" type="file" accept=".xlsx" disabled={reading} onchange={onPick} />
	</label>
</section>
