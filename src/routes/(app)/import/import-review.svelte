<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import {
		chipClass,
		lastOrderDate,
		planDate,
		planLine,
		PREVIEW_PAGE,
		SAMPLE_ROWS,
		statusLabel,
		type Preview,
		type RowStatus
	} from './import-model.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import type { ImportRow } from '#lib/domain/import-sheet.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		preview,
		rows,
		counts,
		onchangefile
	}: {
		preview: Preview;
		rows: { row: ImportRow; status: RowStatus }[];
		counts: { ready: number };
		onchangefile: () => void;
	} = $props();

	let onlyProblems = $state(false);
	let previewLimit = $state(PREVIEW_PAGE);
	let showAll = $state(false);
	let skipLimit = $state(PREVIEW_PAGE);

	const skipped = $derived(rows.filter((c) => c.status !== 'ready'));
	const shownSkipped = $derived(skipped.slice(0, skipLimit));
	const sampleRows = $derived(rows.filter((c) => c.status === 'ready').slice(0, SAMPLE_ROWS));
	const visible = $derived(onlyProblems ? rows.filter((c) => c.status !== 'ready') : rows);
	const shownRows = $derived(visible.slice(0, previewLimit));
	const tableRows = $derived(showAll ? shownRows : sampleRows);
	const hiddenCount = $derived(visible.length - shownRows.length);

	const LINK = '-ml-2.5 h-11 self-start px-2.5 font-semibold desk:h-9';
	// Desktop sample: Baris · Nama · No. WA · Order terakhir · Status · Follow up.
	const COLS = 'grid grid-cols-[52px_minmax(0,1fr)_150px_110px_64px_80px] items-center gap-x-3';
</script>

{#snippet stat(label: string, value: number, sub: string, tone = '')}
	<div class="flex-1 rounded-[10px] border border-rule bg-card px-4 py-3.5">
		<p class="text-[12.5px] font-semibold text-muted-foreground">{label}</p>
		<p class="mt-1 flex items-baseline gap-2">
			<span class={cn('text-[28px] leading-none font-bold tracking-[-0.03em] num', tone)}
				>{value}</span
			>
			<span class="text-[13px] text-muted-foreground">{sub}</span>
		</p>
	</div>
{/snippet}

<div class="flex flex-col gap-5">
	<div class="flex items-center gap-3 rounded-[10px] border border-rule px-3.5 py-3">
		<span
			class="grid size-10 shrink-0 place-items-center rounded-[8px] bg-background text-primary-text"
		>
			<FileText class="size-5" aria-hidden="true" />
		</span>
		<div class="min-w-0 flex-1">
			<p class="truncate text-[14.5px] font-semibold" title={preview.file}>{preview.file}</p>
			<p class="mt-px text-[13px] text-muted-foreground">
				{m.import_file_meta({ sheet: preview.sheet, count: preview.rows.length })}
			</p>
		</div>
		<Button
			variant="outline"
			class="h-11 px-4 text-[13.5px] font-semibold desk:h-9"
			onclick={onchangefile}
		>
			{m.import_change_file()}
		</Button>
	</div>

	<div class="flex flex-col gap-2.5 md:flex-row">
		{@render stat(m.import_status_ready(), counts.ready, m.import_ready_sub())}
		{@render stat(
			m.import_skipped(),
			skipped.length,
			m.import_skipped_sub(),
			skipped.length ? 'text-status-overdue' : ''
		)}
	</div>

	{#if skipped.length > 0}
		<section class="flex flex-col">
			<h2 class="pb-1 text-sm font-bold">{m.import_skipped()}</h2>
			<ul>
				{#each shownSkipped as { row, status } (row.line)}
					<li class="flex gap-3 border-b border-rule py-2.5 text-sm">
						<span class="w-16 shrink-0 text-muted-foreground num"
							>{m.import_row_line({ line: row.line })}</span
						>
						<div class="min-w-0 flex-1">
							<p class="truncate font-semibold" title={row.name}>{row.name}</p>
							<p class="mt-px text-[13px] leading-[19px] text-muted-foreground">
								{statusLabel(status)}
							</p>
						</div>
					</li>
				{/each}
			</ul>
			{#if skipped.length > skipLimit}
				<Button variant="inline" class={LINK} onclick={() => (skipLimit += PREVIEW_PAGE)}>
					{m.import_show_more({ count: Math.min(skipped.length - skipLimit, PREVIEW_PAGE) })}
				</Button>
			{/if}
		</section>
	{/if}

	<!-- With nothing ready, every row is already listed under Dilewati, so there is no sample. -->
	<section class={cn('flex flex-col gap-2', !showAll && sampleRows.length === 0 && 'hidden')}>
		<h2 class="text-sm font-bold">{m.import_sample_title()}</h2>
		{#if showAll}
			<div class="flex items-center justify-between gap-3">
				<Label
					for="only-problems"
					class="flex min-h-11 flex-1 cursor-pointer items-center text-ui desk:min-h-9"
				>
					{m.import_only_problems()}
				</Label>
				<Switch id="only-problems" bind:checked={onlyProblems} />
			</div>
		{/if}

		{#if tableRows.length === 0}
			<p class="rounded-xl border border-rule p-6 text-center text-ui text-muted-foreground">
				{m.import_empty_filter()}
			</p>
		{:else}
			<!-- Desktop: a bordered table. Tablet/phone: name over "Baris 4 · 628…", status over the date. -->
			<div class="xl:overflow-hidden xl:rounded-[10px] xl:border xl:border-rule">
				<div
					class="{COLS} hidden h-[38px] bg-secondary px-3.5 text-xs font-semibold text-muted-foreground xl:grid"
					aria-hidden="true"
				>
					<span>{m.import_col_line()}</span>
					<span>{m.import_col_name()}</span>
					<span>{m.import_col_phone()}</span>
					<span>{m.import_col_last_order()}</span>
					<span>{m.import_col_status()}</span>
					<span>{m.import_col_plan()}</span>
				</div>
				<ul>
					{#each tableRows as { row, status } (row.line)}
						<li
							class="flex items-center justify-between gap-3 border-b border-rule py-2.5 text-sm num xl:grid xl:h-[46px] xl:grid-cols-[52px_minmax(0,1fr)_150px_110px_64px_80px] xl:gap-x-3 xl:px-3.5 xl:py-0 xl:last:border-b-0"
						>
							<span class="hidden text-muted-foreground xl:block">{row.line}</span>
							<div class="min-w-0">
								<p class="truncate text-[14.5px] font-semibold xl:text-sm" title={row.name}>
									{row.name}
								</p>
								<p class="mt-0.5 truncate text-[13px] text-muted-foreground xl:hidden">
									{m.import_row_line({ line: row.line })}&nbsp;· {row.phone ?? '—'}
								</p>
							</div>
							<span class="hidden truncate xl:block">{row.phone ?? '—'}</span>
							<span class="hidden xl:block">{lastOrderDate(row)}</span>
							<div class="shrink-0 text-right xl:contents xl:text-left">
								<span
									class={cn(
										'text-[13px] font-semibold whitespace-nowrap xl:text-sm',
										chipClass[status]
									)}>{statusLabel(status)}</span
								>
								<p
									class="mt-0.5 text-[13px] text-muted-foreground xl:mt-0 xl:text-sm xl:text-foreground"
								>
									<span class="xl:hidden">{planLine(row)}</span>
									<span class="hidden xl:inline">{planDate(row)}</span>
								</p>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if !showAll && preview.rows.length > SAMPLE_ROWS}
			<Button variant="inline" class={LINK} onclick={() => (showAll = true)}>
				{m.import_show_all({ count: preview.rows.length })}
			</Button>
		{/if}
		{#if showAll && hiddenCount > 0}
			<Button variant="inline" class={LINK} onclick={() => (previewLimit += PREVIEW_PAGE)}>
				{m.import_show_more({ count: Math.min(hiddenCount, PREVIEW_PAGE) })}
			</Button>
		{/if}
	</section>

	{#if counts.ready === 0}
		<p class="text-ui text-muted-foreground">{m.import_nothing_ready()}</p>
	{/if}
</div>
