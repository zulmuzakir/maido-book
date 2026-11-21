<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { ProductFields } from '#lib/domain/types.ts';
	import { fieldLabel } from '#lib/styles.ts';

	let {
		idPrefix,
		product = null,
		errors = {}
	}: {
		idPrefix: string;
		product?: ProductFields | null;
		errors?: Record<string, string>;
	} = $props();

	// Harga shows grouped digits ("10.100"); the server strips separators before parsing.
	const group = (digits: string) =>
		digits
			? new Intl.NumberFormat(getLocale() === 'id' ? 'id-ID' : 'en-US').format(Number(digits))
			: '';
	function onPriceInput(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		input.value = group(input.value.replace(/\D/g, ''));
	}

	const INPUT = 'h-11 text-base md:text-[15px] desk:h-11';
</script>

<!-- Desktop: two columns. Tablet/phone: one. -->
<div class="grid gap-x-4 gap-y-[18px] xl:grid-cols-2">
	<div class="space-y-1.5">
		<Label for="{idPrefix}-name" class={fieldLabel}>{m.settings_product_name()}</Label>
		<Input
			id="{idPrefix}-name"
			name="name"
			value={product?.name ?? ''}
			maxlength={60}
			required
			autocomplete="off"
			class={INPUT}
			aria-invalid={!!errors.name}
			aria-describedby={errors.name ? `${idPrefix}-name-error` : undefined}
		/>
		<FieldError id="{idPrefix}-name-error" message={errors.name} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-unit" class={fieldLabel}>{m.settings_product_unit()}</Label>
		<Input
			id="{idPrefix}-unit"
			name="unitLabel"
			value={product?.unitLabel ?? 'sachet'}
			maxlength={20}
			required
			autocomplete="off"
			class={INPUT}
			aria-invalid={!!errors.unitLabel}
			aria-describedby={errors.unitLabel ? `${idPrefix}-unitLabel-error` : undefined}
		/>
		<FieldError id="{idPrefix}-unitLabel-error" message={errors.unitLabel} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-servings" class={fieldLabel}>{m.settings_product_servings()}</Label>
		<Input
			id="{idPrefix}-servings"
			name="servingsPerUnit"
			inputmode="numeric"
			value={String(product?.servingsPerUnit ?? 1)}
			required
			class="{INPUT} num"
			aria-invalid={!!errors.servingsPerUnit}
			aria-describedby={errors.servingsPerUnit ? `${idPrefix}-servingsPerUnit-error` : undefined}
		/>
		<FieldError id="{idPrefix}-servingsPerUnit-error" message={errors.servingsPerUnit} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-price" class={fieldLabel}>{m.settings_product_price()}</Label>
		<InputGroup.Root
			class="h-11 overflow-hidden rounded-lg shadow-none has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-alert desk:h-11"
		>
			<InputGroup.Addon
				align="inline-start"
				class="h-full border-r border-rule bg-background px-3 text-sm font-semibold text-muted-foreground"
			>
				Rp
			</InputGroup.Addon>
			<InputGroup.Input
				id="{idPrefix}-price"
				name="price"
				inputmode="numeric"
				autocomplete="off"
				value={group(String(product?.price ?? 0))}
				oninput={onPriceInput}
				required
				aria-describedby={errors.price
					? `${idPrefix}-price-hint ${idPrefix}-price-error`
					: `${idPrefix}-price-hint`}
				aria-invalid={!!errors.price}
				class="pl-3 text-base num md:text-[15px]"
			/>
		</InputGroup.Root>
		<p id="{idPrefix}-price-hint" class="text-[13px] leading-[19px] text-muted-foreground">
			{m.settings_product_price_hint()}
		</p>
		<FieldError id="{idPrefix}-price-error" message={errors.price} />
	</div>
</div>
