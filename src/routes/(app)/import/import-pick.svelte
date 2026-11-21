<script lang="ts">
	import { asset } from '$app/paths';
	import Download from '@lucide/svelte/icons/download';
	import FileText from '@lucide/svelte/icons/file-text';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Upload from '@lucide/svelte/icons/upload';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { slide } from 'svelte/transition';
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

	const TEMPLATE_HREF = asset('templates/maido-book-import.xlsx');
	const LINK =
		'inline-flex min-h-11 items-center gap-1.5 rounded-sm text-[13.5px] leading-[18px] font-semibold text-primary-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring md:min-h-0 md:py-1';

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
			in:slide={{ duration: motionMs(DURATION.fast), easing: EASE }}
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
				{#if problem.kind === 'missing' || problem.kind === 'empty'}
					{m.import_template_fix()}
					<a href={TEMPLATE_HREF} download class={LINK}>
						<Download class="size-4" aria-hidden="true" />
						{m.import_template_download()}
					</a>
				{/if}
			</span>
		</div>
	{/if}
	<label
		class={cn(
			'flex cursor-pointer flex-col items-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed px-5 py-8 text-center transition-colors duration-(--motion-fast) ease-motion focus-within:ring-3 focus-within:ring-ring md:px-6 md:py-14',
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
	<p
		class="-mt-2 flex flex-wrap items-center justify-center gap-x-2 text-sm leading-5 text-muted-foreground"
	>
		{m.import_template_prompt()}
		<a href={TEMPLATE_HREF} download class={LINK}>
			<Download class="size-4" aria-hidden="true" />
			{m.import_template_download()}
		</a>
	</p>
</section>
