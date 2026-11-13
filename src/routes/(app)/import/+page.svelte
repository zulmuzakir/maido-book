<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import Upload from '@lucide/svelte/icons/upload';
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
		<Upload class="size-[15px]" aria-hidden="true" />
		{m.import_submit({ count: counts.ready })}
	{/if}
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader
		title={m.import_title()}
		back={{ href: resolve('/(app)/more'), label: m.nav_more() }}
		variant="centered"
		backMobileOnly
	>
		{#snippet actions()}
			{#if step === 2 && preview}
				<div class="hidden md:block">
					<Button
						type="submit"
						form="import-form"
						disabled={submitDisabled}
						class="h-9 px-3.5 text-ui font-semibold"
					>
						{@render submitLabel()}
					</Button>
				</div>
			{/if}
		{/snippet}
	</PageHeader>

	<div
		class="page-frame {step === 3
			? 'space-y-5 md:space-y-[22px]'
			: 'space-y-[18px] md:space-y-5'} {step === 2 ? 'md:px-6' : 'md:px-7'} xl:px-0 {step === 2
			? 'md:pt-6'
			: 'md:pt-7'}"
	>
		{#if step !== 2}<ImportStepper {step} />{/if}

		{#if step === 3 && outcome}
			<ImportDone {outcome} onreset={reset} />
		{:else if step === 1}
			<ImportPick {reading} {problem} onfile={readFile} />
		{:else if step === 2 && preview}
			<form id="import-form" method="post" use:enhance={submitImport} hidden>
				<input type="hidden" name="rows" value={payload} />
				<input type="hidden" name="skippedExisting" value={counts.existing + counts.dup} />
				<input type="hidden" name="skippedInvalid" value={counts.invalid} />
			</form>

			{#if tooMany}
				<p
					role="alert"
					class="rounded-[8px] border border-alert-border bg-alert px-3.5 py-3 text-ui leading-[19px] text-alert-foreground"
				>
					{m.import_too_many()}
				</p>
			{/if}
			{#if failureText}
				<p
					role="alert"
					class="rounded-[8px] border border-alert-border bg-alert px-3.5 py-3 text-ui leading-[19px] text-alert-foreground"
				>
					{failureText}
				</p>
			{/if}

			<ImportReview {preview} rows={classified} {counts} onchangefile={reset} />

			<div
				class="sticky bottom-0 z-10 -mx-4 border-t border-rule bg-card px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:hidden"
			>
				<Button
					type="submit"
					form="import-form"
					class="h-12 w-full px-3.5 text-ui font-semibold"
					disabled={submitDisabled}
				>
					{@render submitLabel()}
				</Button>
			</div>
		{/if}
	</div>
</div>
