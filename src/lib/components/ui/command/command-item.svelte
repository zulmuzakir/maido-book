<script lang="ts">
	import { Command as CommandPrimitive } from 'bits-ui';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { cn } from '#lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ItemProps = $props();
</script>

<CommandPrimitive.Item
	bind:ref
	data-slot="command-item"
	class={cn(
		"group/command-item relative flex min-h-11 cursor-default items-center gap-2 border-b border-row-rule px-2 text-ui outline-hidden select-none group-data-[checked=true]/command-item:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset aria-selected:bg-accent aria-selected:ring-1 aria-selected:ring-primary aria-selected:ring-inset data-selected:bg-muted data-selected:text-foreground desk:min-h-9 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 data-selected:**:[svg]:text-foreground",
		'data-disabled:pointer-events-none data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{@render children?.()}
	<CheckIcon
		class="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-data-[checked=true]/command-item:opacity-100"
	/>
</CommandPrimitive.Item>
