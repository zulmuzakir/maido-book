<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
	import ReceiptIcon from '@lucide/svelte/icons/receipt';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import WifiOffIcon from '@lucide/svelte/icons/wifi-off';
	import DateField from '#lib/components/date-field.svelte';
	import DoseField from '#lib/components/dose-field.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import FormActions from '#lib/components/form-actions.svelte';
	import OrderCustomerCombobox from '#lib/components/order-customer-combobox.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import OrderPreview, { type OrderPlan } from './order-preview.svelte';
	import OrderQtyField, { QTY_MAX } from './order-qty-field.svelte';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { formatDate, isIsoDate } from '#lib/domain/dates.ts';
	import { daysOfSupply, reorderDueDate, supplyStatus } from '#lib/domain/follow-up.ts';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { fieldLabel, fieldStack } from '#lib/styles.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const initial = untrack(() => form?.values);
	const toNum = (s: string | undefined): number | null => {
		if (!s) return null;
		const n = Number(s);
		return Number.isFinite(n) ? n : null;
	};
	const groupDigits = (digits: string): string =>
		digits
			? new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-US').format(Number(digits))
			: '';

	const errors = $derived(form?.errors ?? {});
	const hasDetailErrors = $derived(Boolean(errors.totalPaid || errors.note));
	const errorCount = $derived(Object.keys(errors).length);
	// A dropped connection keeps the form as typed and says so here, with a retry button.
	const save = new FormAction(({ update }) => update({ reset: false }), {
		inlineNetworkError: true
	});

	const backHref = $derived(
		data.fromQueue
			? resolve('/(app)')
			: data.preselected
				? resolve('/(app)/customers/[id]', { id: data.preselected.id })
				: resolve('/(app)/orders')
	);
	const backLabel = $derived(
		data.fromQueue ? m.nav_today() : data.preselected ? m.nav_customers() : m.nav_orders()
	);

	// One-time prefill from the failed POST or the ?customer= preselection; later edits are the user's.
	let customerId = $state(untrack(() => initial?.customerId ?? data.preselected?.id ?? ''));
	let productId = $state(untrack(() => initial?.productId ?? data.products[0]?.id ?? ''));
	let orderDate = $state(untrack(() => initial?.orderDate ?? data.today));
	let qty = $state<number | null>(toNum(initial?.qty));
	const initialDose = untrack(
		() => toNum(initial?.dosePerDay) ?? data.preselected?.dosePerDay ?? 1
	);
	let doseChoice = $state([1, 2, 3].includes(initialDose) ? String(initialDose) : 'other');
	let doseOther = $state<string | number | null>(
		[1, 2, 3].includes(initialDose) ? null : initialDose
	);
	const dose = $derived(
		doseChoice === 'other' ? toNum(String(doseOther ?? '')) : Number(doseChoice)
	);

	const product = $derived(data.products.find((p) => p.id === productId) ?? null);
	const price = $derived(product?.price ?? 0);
	const qtyValid = $derived(
		qty !== null && Number.isInteger(qty) && qty >= 1 && qty <= QTY_MAX ? qty : null
	);
	const doseValid = $derived(
		dose !== null && Number.isInteger(dose) && dose >= 1 && dose <= 20 ? dose : null
	);

	// Total is prefilled from price × qty until the user types their own value.
	const suggestedTotal = $derived(price > 0 && qtyValid !== null ? String(price * qtyValid) : '');
	let totalOverride = $state<string | null>(initial?.totalPaid ? initial.totalPaid : null);
	const totalDigits = $derived(totalOverride ?? suggestedTotal);

	function onTotalInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const digits = input.value.replace(/\D/g, '');
		totalOverride = digits;
		input.value = groupDigits(digits);
	}

	function setDoseFor(customerDose: number) {
		if ([1, 2, 3].includes(customerDose)) {
			doseChoice = String(customerDose);
		} else {
			doseChoice = 'other';
			doseOther = customerDose;
		}
	}

	const totalText = $derived(totalDigits ? `Rp ${groupDigits(totalDigits)}` : '—');

	// Live estimate from in-progress values, so the run-out date is visible before saving.
	const plan = $derived.by((): OrderPlan | null => {
		if (!product || qtyValid === null || doseValid === null) return null;
		if (!isIsoDate(orderDate)) return null;
		const days = daysOfSupply({
			qty: qtyValid,
			servingsPerUnit: product.servingsPerUnit,
			dosePerDay: doseValid
		});
		const { runsOutOn, daysLeft } = supplyStatus({
			orderDate,
			daysSupply: days,
			today: data.today
		});
		const dueIso = reorderDueDate({ orderDate, daysSupply: days, leadDays: data.rules.leadDays });
		const locale = getLocale();
		const last = data.customers.find((c) => c.id === customerId)?.lastOrderDate;
		return {
			days,
			daysLeft: Math.max(0, daysLeft),
			dueIso,
			runsOutIso: runsOutOn,
			backdated: !!last && orderDate < last,
			runsOut: formatDate(runsOutOn, locale, 'short'),
			due: formatDate(dueIso, locale, 'short')
		};
	});
</script>

<!-- Desktop: a 560px form and a 360px sticky preview, centred together. Tablet: a 600px column
     with the preview under "Total dan catatan" and a sticky action bar. Phone: one column with
     the action bar above the bottom nav. -->
<div class="min-h-dvh bg-card">
	<PageHeader
		title={m.new_order()}
		variant="subpage"
		back={{ href: backHref, label: backLabel, mobileLabel: m.back() }}
		class="md:px-[max(24px,calc((100%-600px)/2))] xl:px-[calc((100%-960px)/2)]"
	/>

	<div class="px-4 pt-3 pb-6 md:px-6 md:pt-7">
		{#if data.products.length === 0}
			<section
				class="mx-auto flex max-w-[560px] flex-col items-center gap-3 rounded-[12px] bg-background px-6 py-8 text-center shadow-[inset_0_0_0_1px_var(--rule)]"
			>
				<span
					class="grid size-12 place-items-center rounded-full bg-avatar text-primary-text"
					aria-hidden="true"
				>
					<ReceiptIcon class="size-[22px]" />
				</span>
				<h2 class="text-[17px] leading-[22px] font-bold">{m.order_no_products_title()}</h2>
				<p class="max-w-[400px] text-sm leading-[21px] text-muted-foreground">
					{m.order_no_products()}
				</p>
				<Button href={resolve('/(app)/settings')} class="mt-2 font-semibold">
					<SettingsIcon class="size-[18px]" aria-hidden="true" />
					{m.order_no_products_action()}
				</Button>
			</section>
		{:else}
			<form
				id="order-form"
				method="post"
				novalidate
				use:enhance={save.enhance}
				class="mx-auto flex max-w-[600px] flex-col gap-[18px] pb-[88px] md:pb-0 xl:grid xl:w-fit xl:max-w-none xl:grid-cols-[560px_360px] xl:items-start xl:gap-x-10 xl:gap-y-5"
			>
				<!-- While saving, the whole form dims and locks; a failed save leaves it as typed. -->
				<fieldset
					disabled={save.pending}
					class="flex min-w-0 flex-col gap-[18px] transition-opacity disabled:opacity-50"
				>
					<div class={fieldStack}>
						<Label for="order-customer" class={fieldLabel}>{m.order_customer()}</Label>
						<OrderCustomerCombobox
							id="order-customer"
							customers={data.customers}
							bind:value={customerId}
							invalid={Boolean(errors.customerId)}
							onselect={(c) => setDoseFor(c.dosePerDay)}
						/>
						<FieldError
							message={errors.customerId ? fieldError('customerId', errors.customerId) : null}
						/>
						<input type="hidden" name="customerId" value={customerId} />
						{#if data.fromQueue}<input type="hidden" name="from" value="queue" />{/if}
					</div>

					{#if data.products.length > 1}
						<div class={fieldStack}>
							<Label for="order-product" class={fieldLabel}>{m.order_product()}</Label>
							<NativeSelect.Root
								id="order-product"
								name="productId"
								class="w-full"
								bind:value={productId}
							>
								{#each data.products as p (p.id)}
									<NativeSelect.Option value={p.id}>{p.name}</NativeSelect.Option>
								{/each}
							</NativeSelect.Root>
							<FieldError
								message={errors.productId ? fieldError('productId', errors.productId) : null}
							/>
						</div>
					{:else}
						<input type="hidden" name="productId" value={productId} />
					{/if}

					<div class={fieldStack}>
						<Label for="order-date" class={fieldLabel}>{m.order_date()}</Label>
						<DateField
							id="order-date"
							name="orderDate"
							bind:value={orderDate}
							max={data.maxDate}
							invalid={!!errors.orderDate}
							describedby={errors.orderDate ? 'order-date-error' : undefined}
						/>
						<FieldError
							id="order-date-error"
							message={errors.orderDate ? fieldError('orderDate', errors.orderDate) : null}
						/>
					</div>

					<OrderQtyField
						bind:qty
						unitLabel={product?.unitLabel ?? ''}
						invalid={Boolean(errors.qty)}
						error={errors.qty ? fieldError('qty', errors.qty) : null}
					/>

					<DoseField
						idPrefix="order"
						name="dose-choice"
						hint={false}
						selected={doseChoice}
						onselect={(o) => (doseChoice = o)}
						bind:otherValue={doseOther}
						error={errors.dosePerDay ? fieldError('dosePerDay', errors.dosePerDay) : null}
					/>
					<input type="hidden" name="dosePerDay" value={dose ?? ''} />

					<details class="group rounded-[8px] border border-rule bg-card" open={hasDetailErrors}>
						<summary
							class="flex h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-[8px] px-4 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-details-marker]:hidden"
						>
							<span class="min-w-0 truncate text-[15px]">
								<span class="font-semibold">{m.order_more_details()}</span><span
									class="text-muted-foreground num group-open:hidden"
								>
									&nbsp;· {totalText}</span
								>
							</span>
							<ChevronDownIcon
								class="size-[18px] shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
							/>
						</summary>
						<div class="space-y-[18px] px-4 pt-0.5 pb-4">
							<div class={fieldStack}>
								<div class="flex items-baseline gap-1.5">
									<Label for="order-total" class={fieldLabel}>{m.order_total()}</Label>
									<span class="text-xs text-muted-foreground">{m.optional()}</span>
								</div>
								<InputGroup.Root class="h-11 rounded-lg shadow-none desk:h-11">
									<InputGroup.Addon align="inline-start" class="gap-2 pr-0 pl-3">
										<InputGroup.Text class="text-base font-normal desk:text-sm">Rp</InputGroup.Text>
									</InputGroup.Addon>
									<InputGroup.Input
										id="order-total"
										inputmode="numeric"
										autocomplete="off"
										value={groupDigits(totalDigits)}
										oninput={onTotalInput}
										class="text-base num desk:text-sm"
									/>
								</InputGroup.Root>
								<input type="hidden" name="totalPaid" value={totalDigits} />
								<p class="text-ui text-muted-foreground">{m.order_total_hint()}</p>
								<FieldError
									message={errors.totalPaid ? fieldError('totalPaid', errors.totalPaid) : null}
								/>
							</div>

							<div class={fieldStack}>
								<div class="flex items-baseline gap-1.5">
									<Label for="order-note" class={fieldLabel}>{m.order_note()}</Label>
									<span class="text-xs text-muted-foreground">{m.optional()}</span>
								</div>
								<Textarea
									id="order-note"
									name="note"
									maxlength={1000}
									class="field-sizing-fixed h-[88px] py-2.5"
								/>
								<FieldError message={errors.note ? fieldError('note', errors.note) : null} />
							</div>
						</div>
					</details>
				</fieldset>

				<OrderPreview
					{plan}
					{orderDate}
					today={data.today}
					class="xl:sticky xl:top-6 xl:col-start-2 xl:row-span-3 xl:row-start-1"
				/>

				{#if save.networkFailed}
					<div
						role="alert"
						class="hidden items-start gap-2.5 rounded-[8px] bg-alert px-4 py-3 text-sm leading-[21px] text-foreground xl:flex"
					>
						<TriangleAlertIcon class="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
						{m.order_save_failed()}
					</div>
				{/if}

				<FormActions>
					{#snippet note()}
						{#if save.networkFailed}
							<p
								class="flex items-center gap-2 text-ui leading-[18px] font-medium text-destructive xl:hidden"
								role="alert"
							>
								<WifiOffIcon class="size-4 shrink-0" aria-hidden="true" />
								{m.order_save_failed_short()}
							</p>
						{:else if errorCount > 0}
							<p class="text-ui leading-[18px] text-destructive" role="alert">
								{m.form_check_fields({ count: errorCount })}
							</p>
						{:else}
							<p class="hidden text-ui leading-[18px] text-muted-foreground md:block xl:hidden">
								{m.order_auto_note()}
							</p>
						{/if}
					{/snippet}
					<Button size="lg" type="submit" disabled={save.pending}>
						{#if save.pending}
							<LoaderCircleIcon class="size-4 animate-spin" aria-hidden="true" />
							{m.saving()}
						{:else if save.networkFailed}
							<RotateCcwIcon class="size-4" aria-hidden="true" />
							{m.order_retry()}
						{:else}
							{m.order_submit()}
						{/if}
					</Button>
					<Button
						size="lg"
						href={backHref}
						variant="outline"
						aria-disabled={save.pending || undefined}
						class="aria-disabled:pointer-events-none aria-disabled:opacity-45"
					>
						{m.cancel()}
					</Button>
				</FormActions>
			</form>
		{/if}
	</div>
</div>
