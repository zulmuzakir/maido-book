<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import { cn, type WithoutChild } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = 'default',
		...restProps
	}: WithoutChild<SelectPrimitive.TriggerProps> & {
		size?: 'sm' | 'default';
	} = $props();
</script>

<SelectPrimitive.Trigger
	bind:ref
	data-slot="select-trigger"
	data-size={size}
	class={cn(
		"flex h-11 w-fit items-center justify-between gap-1.5 rounded-lg border border-input bg-card pr-2.5 pl-3 text-base whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-45 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-1.5 data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-ring desk:h-10 desk:text-[15px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<ChevronDownIcon class="pointer-events-none size-4 text-muted-foreground" />
</SelectPrimitive.Trigger>
