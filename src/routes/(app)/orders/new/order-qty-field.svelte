<script lang="ts" module>
	export const QTY_MAX = 10000;
</script>

<script lang="ts">
	import MinusIcon from '@lucide/svelte/icons/minus';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import FieldError from '#lib/components/field-error.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { choiceChip, fieldLabel, fieldStack } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';

	const QTY_CHIPS = [10, 20, 30, 50, 100];

	let {
		qty = $bindable(null),
		unitLabel,
		invalid = false,
		error = null
	}: {
		qty: number | null;
		unitLabel: string;
		invalid?: boolean;
		error?: string | null;
	} = $props();

	function stepQty(delta: number) {
		qty = Math.min(QTY_MAX, Math.max(1, (qty ?? 0) + delta));
	}
</script>

<div class={fieldStack}>
	<Label for="order-qty" class={fieldLabel}>
		{m.order_qty({ unit: unitLabel })}
	</Label>
	<div class="space-y-2">
		<div class="flex items-center gap-2">
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label={m.order_qty_less()}
				class="desk:size-11"
				disabled={(qty ?? 0) <= 1}
				onclick={() => stepQty(-1)}
			>
				<MinusIcon />
			</Button>
			<Input
				id="order-qty"
				name="qty"
				type="number"
				inputmode="numeric"
				min="1"
				max={QTY_MAX}
				step="1"
				aria-invalid={invalid ? 'true' : undefined}
				bind:value={qty}
				class="h-11 min-w-0 flex-1 [appearance:textfield] text-center text-[17px] font-bold num desk:h-11 desk:text-[17px] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
			/>
			<Button
				type="button"
				variant="outline"
				size="icon"
				aria-label={m.order_qty_more()}
				class="desk:size-11"
				disabled={(qty ?? 0) >= QTY_MAX}
				onclick={() => stepQty(1)}
			>
				<PlusIcon />
			</Button>
		</div>
		<!-- The error sits between the number and the presets, next to what it is about. -->
		<FieldError message={error} />
		<div class="grid grid-cols-5 gap-2">
			{#each QTY_CHIPS as n (n)}
				<button
					type="button"
					aria-pressed={qty === n}
					data-state={qty === n ? 'on' : 'off'}
					onclick={() => (qty = n)}
					class={cn(choiceChip, 'px-2 num')}
				>
					{n}
				</button>
			{/each}
		</div>
	</div>
</div>
