<script lang="ts">
	import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
	import ImportStatusChip from './import-status-chip.svelte';
	import {
		lastOrderDate,
		lastOrderDetail,
		planDate,
		planDetail,
		PREVIEW_PAGE,
		SAMPLE_ROWS,
		statusLabel,
		statusLabelCompact,
		type Preview,
		type RowStatus
	} from './import-model.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import type { ImportRow } from '#lib/domain/import-sheet.ts';
	import { formatPhone } from '#lib/domain/phone.ts';
	import { m } from '#lib/paraglide/messages.js';

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
</script>

<div class="grid gap-[18px] md:gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:gap-0">
	<div class="min-w-0 space-y-[18px] md:space-y-6">
		<div class="flex items-center gap-3.5 rounded-[8px] border border-rule p-4">
			<span
				class="grid size-11 shrink-0 place-items-center rounded-[8px] bg-success-tint text-status-done"
			>
				<FileSpreadsheet class="size-5" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<p class="truncate text-sm font-semibold" title={preview.file}>{preview.file}</p>
				<p class="text-ui text-muted-foreground">
					{m.import_file_meta({ sheet: preview.sheet, count: preview.rows.length })}
				</p>
			</div>
			<Button
				variant="ghost"
				class="h-8 px-2 text-ui font-semibold text-primary-text"
				onclick={onchangefile}
			>
				{m.import_change_file()}
			</Button>
		</div>

		<div class="flex gap-8">
			<div class="flex flex-col gap-1.5">
				<p class="text-ui text-muted-foreground">{m.import_status_ready()}</p>
				<p class="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] num max-md:text-2xl">
					{counts.ready}
				</p>
				<p class="text-xs font-medium text-status-done">{m.import_ready_sub()}</p>
			</div>
			<div class="flex flex-col gap-1.5">
				<p class="text-ui text-muted-foreground">{m.import_skipped()}</p>
				<p class="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] num max-md:text-2xl">
					{skipped.length}
				</p>
				<p class="text-xs font-medium text-status-today">
					<span class="md:hidden">{m.import_skipped_sub_short()}</span>
					<span class="hidden md:inline">{m.import_skipped_sub()}</span>
				</p>
			</div>
		</div>

		{#if skipped.length > 0}
			<section class="flex flex-col">
				<h2 class="pb-1 text-sm leading-[18px] font-bold">{m.import_skipped()}</h2>
				<ul>
					{#each shownSkipped as { row, status } (row.line)}
						<li class="flex min-h-11 items-center gap-3 border-b border-row-rule text-ui">
							<span class="w-[60px] shrink-0 text-muted-foreground num"
								>{m.import_row_line({ line: row.line })}</span
							>
							<span class="w-[90px] shrink-0 truncate font-semibold md:w-[110px]" title={row.name}
								>{row.name}</span
							>
							<span class="min-w-0 text-status-today">
								<span class="md:hidden">{statusLabelCompact(status)}</span>
								<span class="hidden md:inline">{statusLabel(status)}</span>
							</span>
						</li>
					{/each}
				</ul>
				{#if skipped.length > skipLimit}
					<Button
						variant="ghost"
						class="mt-2 self-start"
						onclick={() => (skipLimit += PREVIEW_PAGE)}
					>
						{m.import_show_more({
							count: Math.min(skipped.length - skipLimit, PREVIEW_PAGE)
						})}
					</Button>
				{/if}
			</section>
		{/if}

		<section class="flex flex-col">
			<h2 class="pb-1.5 text-sm leading-[18px] font-semibold xl:pb-1 xl:font-bold">
				{m.import_sample_title()}
			</h2>
			{#if showAll}
				<div class="mt-3 flex items-center justify-between gap-3">
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
				<div class="overflow-hidden">
					<Table.Root>
						<Table.Header class="hidden xl:table-header-group">
							<Table.Row class="border-row-rule hover:bg-transparent">
								<Table.Head class="h-8 w-[44px] text-xs font-semibold text-muted-foreground"
									>{m.import_col_line()}</Table.Head
								>
								<Table.Head class="h-8 text-xs font-semibold text-muted-foreground"
									>{m.import_col_name()}</Table.Head
								>
								<Table.Head class="h-8 w-[130px] text-xs font-semibold text-muted-foreground"
									>{m.import_col_phone()}</Table.Head
								>
								<Table.Head class="h-8 w-[90px] text-xs font-semibold text-muted-foreground"
									>{m.import_col_last_order()}</Table.Head
								>
								<Table.Head class="h-8 w-[52px] text-xs font-semibold text-muted-foreground"
									>{m.import_col_status()}</Table.Head
								>
								<Table.Head class="h-8 w-[60px] text-xs font-semibold text-muted-foreground"
									>{m.import_col_plan()}</Table.Head
								>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each tableRows as { row, status } (row.line)}
								<Table.Row class="h-12 border-row-rule hover:bg-muted">
									<Table.Cell
										class="w-6 text-xs text-muted-foreground num first:pl-0 md:w-14 md:text-ui xl:w-[44px]"
										>{row.line}</Table.Cell
									>
									<Table.Cell
										class="min-w-0 py-1.5 text-ui font-semibold first:pl-0 last:pr-0 md:py-2"
									>
										<span class="block truncate" title={row.name}>{row.name}</span>
										<span class="block text-xs font-normal text-muted-foreground num md:hidden"
											>{row.phone ? formatPhone(row.phone) : '—'}</span
										>
									</Table.Cell>
									<Table.Cell
										class="hidden text-ui num last:pr-0 md:table-cell md:w-[150px] xl:w-[130px]"
										>{row.phone ? formatPhone(row.phone) : '—'}</Table.Cell
									>
									<Table.Cell
										class="hidden text-ui whitespace-normal num last:pr-0 md:table-cell md:w-[90px]"
									>
										<span class="block">{lastOrderDate(row)}</span>
										{#if lastOrderDetail(row)}
											<span class="block text-xs text-muted-foreground">{lastOrderDetail(row)}</span
											>
										{/if}
									</Table.Cell>
									<Table.Cell class="w-[56px] last:pr-0 xl:w-[52px]"
										><ImportStatusChip {status} /></Table.Cell
									>
									<Table.Cell
										class="hidden text-ui whitespace-normal last:pr-0 xl:table-cell xl:w-[60px]"
									>
										<span class="block">{planDate(row)}</span>
										{#if planDetail(row)}
											<span class="block text-xs text-muted-foreground">{planDetail(row)}</span>
										{/if}
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}

			{#if !showAll && preview.rows.length > SAMPLE_ROWS}
				<Button variant="ghost" class="self-start" onclick={() => (showAll = true)}>
					{m.import_show_all({ count: preview.rows.length })}
				</Button>
			{/if}
			{#if showAll && hiddenCount > 0}
				<Button variant="ghost" class="self-start" onclick={() => (previewLimit += PREVIEW_PAGE)}>
					{m.import_show_more({ count: Math.min(hiddenCount, PREVIEW_PAGE) })}
				</Button>
			{/if}
		</section>

		{#if counts.ready === 0}
			<p class="text-ui text-muted-foreground">{m.import_nothing_ready()}</p>
		{/if}
	</div>

	<aside class="space-y-3 xl:space-y-[18px] xl:border-l xl:border-rule xl:p-6">
		<div class="space-y-[3px]">
			<h2 class="text-[15px] leading-[18px] font-bold tracking-[-0.02em]">
				{m.import_notes_title()}
			</h2>
			<p class="text-ui text-muted-foreground">{m.import_notes_sub()}</p>
		</div>
		<p class="rounded-[8px] bg-subtle px-3.5 py-3 text-ui leading-[19px] text-subtle-foreground">
			{m.import_sheet_note()}
		</p>
		<p class="rounded-[8px] bg-subtle px-3.5 py-3 text-ui leading-[19px] text-subtle-foreground">
			{m.import_existing_note()}
		</p>
		<p class="rounded-[8px] bg-subtle px-3.5 py-3 text-ui leading-[19px] text-subtle-foreground">
			{m.import_limit_note()}
		</p>
	</aside>
</div>
