<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { formatDate, isIsoDate } from '#lib/domain/dates.ts';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		id,
		name,
		value = $bindable(''),
		min,
		max,
		required = false,
		invalid = false,
		describedby,
		label,
		class: className
	}: {
		id: string;
		name?: string;
		/** `YYYY-MM-DD`. */
		value?: string;
		min?: string;
		max?: string;
		required?: boolean;
		invalid?: boolean;
		/** Ids of the hint and error lines that describe the field. */
		describedby?: string;
		/** Accessible name when no visible `<label for={id}>` names the field. */
		label?: string;
		class?: string;
	} = $props();

	const locale = $derived(getLocale());
</script>

<!-- A field-styled box showing the long date. The native date input is transparent and covers the
     box, so a tap or click opens the browser's own picker and the form posts the ISO value. -->
<div
	class={cn(
		'relative flex h-11 items-center gap-2.5 rounded-lg border border-input bg-card px-3 text-base has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20 desk:h-10 desk:text-[15px]',
		className
	)}
>
	<CalendarIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
	<span class="num" aria-hidden="true">
		{isIsoDate(value) ? formatDate(value, locale, 'long') : ''}
	</span>
	<input
		{id}
		{name}
		type="date"
		{min}
		{max}
		{required}
		bind:value
		aria-label={label}
		aria-invalid={invalid ? 'true' : undefined}
		aria-describedby={describedby || undefined}
		class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
	/>
</div>
