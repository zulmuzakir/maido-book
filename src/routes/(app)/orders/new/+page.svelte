<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
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
	import { fieldLabel, fieldStack, formColumn } from '#lib/styles.ts';
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
	<PageHeader
		title={m.new_order()}
		variant="subpage"
		back={{ href: backHref, label: backLabel, mobileLabel: m.back() }}
	/>

	<div class="page-frame md:px-7">
		{#if data.products.length === 0}
			<div
				class="flex w-full flex-col items-center gap-4 rounded-lg border border-rule p-6 text-center md:max-w-[560px]"
			>
				<p class="text-sm text-muted-foreground">{m.order_no_products()}</p>
				<Button href={resolve('/(app)/settings')}>{m.order_no_products_action()}</Button>
			</div>
		{:else}
			<form id="order-form" method="post" use:enhance={save.enhance} class={formColumn}>
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
					<!-- The native date input is transparent and covers the visible box, so a tap opens the picker. -->
					<div
						class="relative flex h-11 items-center gap-2 rounded-lg border border-input bg-card px-3 text-base has-[:focus-visible]:border-ring has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring has-[[aria-invalid]]:border-destructive has-[[aria-invalid]]:ring-3 has-[[aria-invalid]]:ring-destructive/20 desk:h-10 desk:text-sm"
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

				<DoseField
					idPrefix="order"
					name="dose-choice"
					selected={doseChoice}
					onselect={(o) => (doseChoice = o)}
					bind:otherValue={doseOther}
					error={errors.dosePerDay ? fieldError('dosePerDay', errors.dosePerDay) : null}
				/>
				<input type="hidden" name="dosePerDay" value={dose ?? ''} />

				<details class="group border-y border-rule" open={hasDetailErrors}>
					<summary
						class="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 {fieldLabel} focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none desk:min-h-9 [&::-webkit-details-marker]:hidden"
					>
						{m.order_more_details()}
						<ChevronDownIcon
							class="size-4 text-muted-foreground transition-transform group-open:rotate-180"
						/>
					</summary>
					<div class="space-y-[18px] pt-1.5 pb-[18px]">
						<div class={fieldStack}>
							<Label for="order-total" class={fieldLabel}>{m.order_total()}</Label>
							<InputGroup.Root class="h-11 rounded-lg shadow-none desk:h-10">
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

				<OrderPreview {plan} {orderDate} today={data.today} leadDays={data.rules.leadDays} />

				<FormActions>
					<Button size="lg" type="submit" disabled={save.pending}>{m.order_submit()}</Button>
					<Button size="lg" href={backHref} variant="outline">{m.cancel()}</Button>
				</FormActions>
			</form>
		{/if}
	</div>
</div>
