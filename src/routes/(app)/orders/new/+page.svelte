<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import DoseChips from '#lib/components/dose-chips.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import OrderCustomerCombobox from '#lib/components/order-customer-combobox.svelte';
	import OrderPreview, { type OrderPlan } from './order-preview.svelte';
	import OrderQtyField, { QTY_MAX } from './order-qty-field.svelte';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import * as NativeSelect from '#lib/components/ui/native-select/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { formatDate, isIsoDate } from '#lib/domain/dates.ts';
	import { daysOfSupply, reorderDueDate, supplyStatus } from '#lib/domain/follow-up.ts';
	import { fieldError } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
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
	const save = new FormAction(({ update }) => update({ reset: false }));

	const backHref = $derived(
		data.preselected
			? resolve('/(app)/customers/[id]', { id: data.preselected.id })
			: resolve('/(app)/orders')
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
	let doseOther = $state<number | null>([1, 2, 3].includes(initialDose) ? null : initialDose);
	const dose = $derived(doseChoice === 'other' ? doseOther : Number(doseChoice));

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

	// Live estimate from in-progress values, so the run-out date is visible before saving.
	const plan = $derived.by((): OrderPlan | null => {
		if (!product || qtyValid === null || doseValid === null) return null;
		if (!isIsoDate(orderDate)) return null;
		const days = daysOfSupply({
			qty: qtyValid,
			servingsPerUnit: product.servingsPerUnit,
			dosePerDay: doseValid
		});
		const { runsOutOn } = supplyStatus({ orderDate, daysSupply: days, today: data.today });
		const dueIso = reorderDueDate({ orderDate, daysSupply: days, leadDays: data.rules.leadDays });
		const locale = getLocale();
		const last = data.customers.find((c) => c.id === customerId)?.lastOrderDate;
		return {
			days,
			dueIso,
			backdated: !!last && orderDate < last,
			runsOut: formatDate(runsOutOn, locale, 'short'),
			due: formatDate(dueIso, locale, 'short')
		};
	});
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<div class="page-frame px-4 pt-8 pb-10 md:px-5">
		<div class="mx-auto max-w-[576px]">
			<header class="space-y-1 border-b border-rule pb-4">
				<Button
					href={backHref}
					variant="ghost"
					size="sm"
					class="-ml-1 h-11 px-0 text-ui font-normal text-muted-foreground desk:h-9"
				>
					<ChevronLeftIcon aria-hidden="true" />
					{m.back()}
				</Button>
				<h1 class="text-[24px] leading-[30px] font-semibold tracking-[-0.3px]">{m.new_order()}</h1>
			</header>
			{#if data.products.length === 0}
				<div
					class="mx-auto mt-6 flex w-full flex-col items-center gap-4 rounded-lg border border-rule p-6 text-center"
				>
					<p class="text-sm text-muted-foreground">{m.order_no_products()}</p>
					<Button href={resolve('/(app)/settings')} class="text-sm desk:px-4"
						>{m.order_no_products_action()}</Button
					>
				</div>
			{:else}
				<form
					id="order-form"
					method="post"
					use:enhance={save.enhance}
					class="mt-4 space-y-4 pb-[120px] md:pb-0"
				>
					<div class="space-y-6 rounded-lg border border-rule bg-card p-4 md:p-6">
						<div class="space-y-2">
							<Label for="order-customer" class="text-[13px] leading-4 font-medium"
								>{m.order_customer()}</Label
							>
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
						</div>

						{#if data.products.length > 1}
							<div class="space-y-2">
								<Label for="order-product" class="text-[13px] leading-4 font-medium"
									>{m.order_product()}</Label
								>
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

						<div class="space-y-2">
							<Label for="order-date" class="text-[13px] leading-4 font-medium"
								>{m.order_date()}</Label
							>
							<!-- The native date input is transparent and covers the visible box, so a tap opens the picker. -->
							<div
								class="relative flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-base has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50 has-[[aria-invalid]]:border-destructive has-[[aria-invalid]]:ring-3 has-[[aria-invalid]]:ring-destructive/20 md:text-sm desk:h-9 desk:text-ui"
							>
								<CalendarIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
								<span aria-hidden="true">
									{isIsoDate(orderDate) ? formatDate(orderDate, getLocale(), 'long') : ''}
								</span>
								<input
									id="order-date"
									name="orderDate"
									type="date"
									max={data.maxDate}
									aria-label={m.order_date()}
									aria-invalid={errors.orderDate ? 'true' : undefined}
									bind:value={orderDate}
									class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
								/>
							</div>
							<FieldError
								message={errors.orderDate ? fieldError('orderDate', errors.orderDate) : null}
							/>
						</div>

						<OrderQtyField
							bind:qty
							unitLabel={product?.unitLabel ?? ''}
							invalid={Boolean(errors.qty)}
							error={errors.qty ? fieldError('qty', errors.qty) : null}
						/>

						<fieldset class="space-y-2">
							<legend class="text-[13px] leading-4 font-medium">{m.dose_per_day()}</legend>
							<DoseChips
								name="dose-choice"
								segmented
								selected={doseChoice}
								onselect={(o) => (doseChoice = o)}
							/>
							{#if doseChoice === 'other'}
								<Input
									id="order-dose-other"
									type="number"
									inputmode="numeric"
									min="1"
									max="20"
									step="1"
									aria-label={m.dose_per_day()}
									bind:value={doseOther}
									class="text-base num md:text-sm desk:text-ui"
								/>
							{/if}
							<input type="hidden" name="dosePerDay" value={dose ?? ''} />
							<FieldError
								message={errors.dosePerDay ? fieldError('dosePerDay', errors.dosePerDay) : null}
							/>
						</fieldset>
					</div>

					<details class="group rounded-lg border border-rule bg-card" open={hasDetailErrors}>
						<summary
							class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none desk:min-h-9 [&::-webkit-details-marker]:hidden"
						>
							{m.order_more_details()}
							<ChevronDownIcon
								class="text-muted-foreground transition-transform group-open:rotate-180"
							/>
						</summary>
						<div class="space-y-6 border-t border-rule p-4">
							<div class="space-y-2">
								<Label for="order-total" class="text-[13px] leading-4 font-medium"
									>{m.order_total()}</Label
								>
								<InputGroup.Root class="h-11 rounded-lg shadow-none desk:h-9">
									<InputGroup.Addon align="inline-start" class="gap-2 pr-0 pl-3">
										<InputGroup.Text class="text-sm font-normal desk:text-ui">Rp</InputGroup.Text>
									</InputGroup.Addon>
									<InputGroup.Input
										id="order-total"
										inputmode="numeric"
										autocomplete="off"
										value={groupDigits(totalDigits)}
										oninput={onTotalInput}
										class="text-base num md:text-sm desk:text-ui"
									/>
								</InputGroup.Root>
								<input type="hidden" name="totalPaid" value={totalDigits} />
								<p class="text-ui text-muted-foreground">{m.order_total_hint()}</p>
								<FieldError
									message={errors.totalPaid ? fieldError('totalPaid', errors.totalPaid) : null}
								/>
							</div>

							<div class="space-y-2">
								<Label for="order-note" class="text-[13px] leading-4 font-medium"
									>{m.order_note()}</Label
								>
								<Textarea
									id="order-note"
									name="note"
									maxlength={1000}
									class="field-sizing-fixed h-[72px] px-3 py-2 text-base md:text-sm desk:text-ui"
								/>
								<FieldError message={errors.note ? fieldError('note', errors.note) : null} />
							</div>
						</div>
					</details>

					<OrderPreview {plan} {orderDate} today={data.today} leadDays={data.rules.leadDays} />

					<div
						class="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-rule bg-card px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))] md:static md:justify-end md:border-0 md:bg-transparent md:p-0"
					>
						<Button
							href={backHref}
							variant="outline"
							class="flex-1 text-sm font-medium md:flex-none desk:px-4 desk:text-sm"
						>
							{m.cancel()}
						</Button>
						<Button
							type="submit"
							class="flex-1 text-sm md:flex-none desk:px-4 desk:text-sm"
							disabled={save.pending}
						>
							{m.order_submit()}
						</Button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
