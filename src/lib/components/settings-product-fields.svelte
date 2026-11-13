<script lang="ts">
	import FieldError from '#lib/components/field-error.svelte';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { Product } from '#lib/server/crm/settings.ts';

	let {
		idPrefix,
		product = null,
		errors = {}
	}: {
		idPrefix: string;
		product?: Product | null;
		errors?: Record<string, string>;
	} = $props();
</script>

<div class="grid grid-cols-2 gap-4">
	<div class="space-y-1.5">
		<Label for="{idPrefix}-name" class="text-ui leading-4 font-semibold"
			>{m.settings_product_name()}</Label
		>
		<Input
			id="{idPrefix}-name"
			name="name"
			value={product?.name ?? ''}
			maxlength={60}
			required
			autocomplete="off"
			class="h-10 text-base md:text-sm desk:h-10"
			aria-invalid={!!errors.name}
		/>
		<FieldError message={errors.name} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-unit" class="text-ui leading-4 font-semibold"
			>{m.settings_product_unit()}</Label
		>
		<Input
			id="{idPrefix}-unit"
			name="unitLabel"
			value={product?.unitLabel ?? 'sachet'}
			maxlength={20}
			required
			autocomplete="off"
			class="h-10 text-base md:text-sm desk:h-10"
			aria-invalid={!!errors.unitLabel}
		/>
		<p class="text-ui text-muted-foreground">{m.settings_product_unit_hint()}</p>
		<FieldError message={errors.unitLabel} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-servings" class="text-ui leading-4 font-semibold"
			>{m.settings_product_servings()}</Label
		>
		<Input
			id="{idPrefix}-servings"
			name="servingsPerUnit"
			inputmode="numeric"
			value={String(product?.servingsPerUnit ?? 1)}
			required
			class="h-10 text-base num md:text-sm desk:h-10"
			aria-invalid={!!errors.servingsPerUnit}
		/>
		<p class="text-ui text-muted-foreground">{m.settings_product_servings_hint()}</p>
		<FieldError message={errors.servingsPerUnit} />
	</div>

	<div class="space-y-1.5">
		<Label for="{idPrefix}-price" class="text-ui leading-4 font-semibold"
			>{m.settings_product_price()}</Label
		>
		<Input
			id="{idPrefix}-price"
			name="price"
			inputmode="numeric"
			value={String(product?.price ?? 0)}
			required
			class="h-10 text-base num md:text-sm desk:h-10"
			aria-invalid={!!errors.price}
		/>
		<FieldError message={errors.price} />
	</div>
</div>
<p class="text-xs leading-4 text-muted-foreground">{m.settings_product_price_hint()}</p>
