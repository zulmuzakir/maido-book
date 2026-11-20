<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import Check from '@lucide/svelte/icons/check';
	import ImportDone from './import-done.svelte';
	import ImportPick from './import-pick.svelte';
	import ImportReview from './import-review.svelte';
	import ImportStepper from './import-stepper.svelte';
	import {
		MAX_FILE_BYTES,
		MAX_ROWS,
		type Failure,
		type Outcome,
		type Preview,
		type ReadProblem,
		type RowStatus
	} from './import-model.ts';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { todayIso } from '#lib/domain/dates.ts';
	import { mapCustomerSheet, type ImportRow } from '#lib/domain/import-sheet.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let step = $state<1 | 2 | 3>(1);
	let reading = $state(false);
	let problem = $state<ReadProblem | null>(null);
	let preview = $state<Preview | null>(null);
	let submitting = $state(false);
	let failure = $state<Failure | null>(null);
	let outcome = $state<Outcome | null>(null);

	const taken = $derived(new Set(data.existingPhones));

	function statusOf(row: ImportRow): RowStatus {
		if (row.issue) return row.issue;
		if (row.phone && taken.has(row.phone)) return 'existing';
		return 'ready';
	}

	const classified = $derived(preview?.rows.map((row) => ({ row, status: statusOf(row) })) ?? []);
	const counts = $derived({
		ready: classified.filter((c) => c.status === 'ready').length,
		existing: classified.filter((c) => c.status === 'existing').length,
		invalid: classified.filter(
			(c) => c.status === 'invalid_phone' || c.status === 'phone_date_format'
		).length,
		dup: classified.filter((c) => c.status === 'duplicate_in_file').length
	});
	const readyRows = $derived(classified.filter((c) => c.status === 'ready').map((c) => c.row));
	const tooMany = $derived(readyRows.length > MAX_ROWS);
	const submitDisabled = $derived(submitting || tooMany || counts.ready === 0);
	const payload = $derived(
		JSON.stringify(
			readyRows.map((row) => ({
				name: row.name,
				phone: row.phone,
				productName: row.productName,
				qty: row.qty,
				dosePerDay: row.dosePerDay,
				lastOrderDate: row.lastOrderDate,
				lastAction: row.lastAction,
				notes: row.notes
			}))
		)
	);
	const skippedCount = $derived(classified.length - counts.ready);
	const BUTTON = 'h-12 px-4 text-sm font-semibold desk:h-11';
	const ALERT = 'rounded-[8px] bg-alert px-3.5 py-3 text-sm leading-5 text-alert-foreground';
	const failureText = $derived(
		failure === 'empty'
			? m.import_nothing_new()
			: failure === 'invalid'
				? m.import_invalid_rows()
				: failure === 'failed'
					? m.import_failed()
					: null
	);

	function reset() {
		step = 1;
		preview = null;
		problem = null;
		outcome = null;
		failure = null;
	}

	async function readFile(file: File) {
		problem = null;
		preview = null;
		if (!file.name.toLowerCase().endsWith('.xlsx')) {
			problem = { kind: 'type' };
			return;
		}
		if (file.size > MAX_FILE_BYTES) {
			problem = { kind: 'size' };
			return;
		}
		reading = true;
		try {
			const { default: readXlsxFile } = await import('read-excel-file/browser');
			const sheets = await readXlsxFile(file);
			const sheet = sheets.find((s) => s.sheet.toLowerCase().includes('customer')) ?? sheets[0];
			if (!sheet) {
				problem = { kind: 'read' };
				return;
			}
			const mapped = mapCustomerSheet(sheet.data, todayIso(), data.rules);
			if ('error' in mapped) {
				problem = { kind: 'missing', columns: mapped.missing, sheet: sheet.sheet };
				return;
			}
			if (mapped.rows.length === 0) {
				problem = { kind: 'empty', sheet: sheet.sheet };
				return;
			}
			outcome = null;
			failure = null;
			preview = { file: file.name, sheet: sheet.sheet, today: todayIso(), rows: mapped.rows };
			step = 2;
		} catch {
			problem = { kind: 'read' };
		} finally {
			reading = false;
		}
	}

	function submitImport() {
		submitting = true;
		failure = null;
		return async ({ result }: { result: { type: string; data?: unknown } }) => {
			submitting = false;
			if (result.type === 'success') {
				outcome = result.data as Outcome;
				step = 3;
				toast.success(m.toast_import_done());
				await invalidateAll();
			} else if (result.type === 'failure') {
				const d = result.data as { invalid?: boolean; empty?: boolean } | undefined;
				failure = d?.empty ? 'empty' : d?.invalid ? 'invalid' : 'failed';
			} else {
				failure = 'failed';
			}
		};
	}
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

{#snippet submitLabel()}
	{#if submitting}
		<Spinner />
		{m.import_importing()}
	{:else}
		{m.import_submit({ count: counts.ready })}
	{/if}
{/snippet}

{#snippet notes(id: string, cls: string)}
	<!-- Desktop: a 300px panel with check marks on every step. Tablet/phone: a bulleted list under
	     the dropzone. -->
	<aside class={cls} aria-labelledby={id}>
		<h2 {id} class="text-sm font-bold">{m.import_notes_title()}</h2>
		<ul class="flex flex-col gap-3 text-[13.5px] leading-5 max-xl:gap-2 max-xl:text-sm xl:gap-3">
			{#each [m.import_sheet_note(), m.import_existing_note(), m.import_limit_note()] as note, i (i)}
				<li class="flex gap-2.5">
					<Check
						class="mt-0.5 hidden size-4 shrink-0 text-primary-text xl:block"
						aria-hidden="true"
					/>
					<span
						class="mt-2 size-[5px] shrink-0 rounded-full bg-primary-text xl:hidden"
						aria-hidden="true"
					></span>
					<span>{note}</span>
				</li>
			{/each}
		</ul>
	</aside>
{/snippet}

{#snippet actionButtons(cls: string)}
	<Button variant="outline" class={cn(BUTTON, 'w-[34%] md:w-auto', cls)} onclick={reset}>
		{m.cancel()}
	</Button>
	<Button
		type="submit"
		form="import-form"
		disabled={submitDisabled}
		class={cn(BUTTON, 'flex-1 md:flex-none', cls)}
	>
		{@render submitLabel()}
	</Button>
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader
		title={m.import_title()}
		back={{ href: resolve('/(app)/more'), label: m.nav_more() }}
		variant="subpage"
		backMobileOnly
		metaInline="md"
		class="md:px-[max(24px,calc((100%-600px)/2))] xl:px-[54px]"
	>
		{#snippet meta()}{m.import_step_of({ step })}{/snippet}
	</PageHeader>

	<div
		class="flex items-start gap-10 px-4 pt-1 pb-8 md:mx-auto {step === 2
			? 'md:pb-28 xl:pb-8'
			: ''} md:max-w-[648px] md:px-6 md:pt-7 xl:mx-0 xl:max-w-none xl:px-[54px]"
	>
		<div class="flex min-w-0 flex-1 flex-col gap-5 xl:max-w-[760px]">
			<ImportStepper {step} finished={step === 3 && !!outcome} />

			{#if step === 3 && outcome}
				<ImportDone {outcome} onreset={reset} />
			{:else if step === 1}
				<ImportPick {reading} {problem} onfile={readFile} />
				{@render notes('import-notes-list', 'flex flex-col gap-2 xl:hidden')}
			{:else if step === 2 && preview}
				<form id="import-form" method="post" use:enhance={submitImport} hidden>
					<input type="hidden" name="rows" value={payload} />
					<input type="hidden" name="skippedExisting" value={counts.existing + counts.dup} />
					<input type="hidden" name="skippedInvalid" value={counts.invalid} />
				</form>

				{#if tooMany}
					<p role="alert" class={ALERT}>{m.import_too_many()}</p>
				{/if}
				{#if failureText}
					<p role="alert" class={ALERT}>{failureText}</p>
				{/if}

				<ImportReview {preview} rows={classified} {counts} onchangefile={reset} />

				<!-- Desktop: right-aligned under the table. -->
				<div class="hidden justify-end gap-2.5 xl:flex">
					{@render actionButtons('')}
				</div>
				<!-- Tablet: a sticky bar with the summary. Phone: Batal and Impor above the bottom nav. -->
				<div
					class="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-10 -mx-4 flex items-center gap-2 border-t border-rule bg-card px-4 py-2.5 shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)] md:fixed md:inset-x-0 md:bottom-0 md:left-[84px] md:mx-0 md:gap-2.5 md:px-[max(24px,calc((100vw-84px-600px)/2))] md:py-3 xl:hidden"
				>
					<p class="hidden flex-1 text-sm text-muted-foreground md:block">
						{skippedCount
							? m.import_review_summary({ count: skippedCount })
							: m.import_review_summary_none()}
					</p>
					{@render actionButtons('md:h-11')}
				</div>
			{/if}
		</div>

		{@render notes(
			'import-notes-panel',
			'hidden w-[300px] shrink-0 flex-col gap-3 rounded-[12px] bg-background p-5 xl:flex'
		)}
	</div>
</div>
