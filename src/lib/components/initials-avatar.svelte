<script lang="ts">
	import { initialsOf } from '#lib/format.ts';
	import { cn } from '#lib/utils.js';

	type Size = 28 | 30 | 36 | 40 | 44 | 48 | 56;

	// Full class names (not built by string interpolation) so Tailwind generates every variant.
	const CLASSES: Record<Size, { box: string; text: string; mdBox: string; mdText: string }> = {
		28: { box: 'size-7', text: 'text-xs', mdBox: 'md:size-7', mdText: 'md:text-xs' },
		30: { box: 'size-[30px]', text: 'text-xs', mdBox: 'md:size-[30px]', mdText: 'md:text-xs' },
		36: { box: 'size-9', text: 'text-ui', mdBox: 'md:size-9', mdText: 'md:text-ui' },
		40: { box: 'size-10', text: 'text-ui', mdBox: 'md:size-10', mdText: 'md:text-ui' },
		44: { box: 'size-11', text: 'text-sm', mdBox: 'md:size-11', mdText: 'md:text-sm' },
		48: { box: 'size-12', text: 'text-sm', mdBox: 'md:size-12', mdText: 'md:text-sm' },
		56: { box: 'size-14', text: 'text-xl', mdBox: 'md:size-14', mdText: 'md:text-xl' }
	};

	let {
		name,
		size = 36,
		mdSize,
		class: className
	}: { name: string; size?: Size; mdSize?: Size; class?: string } = $props();

	// `mdSize` sets the size from `md` up; `size` applies below it.
	const sizeClasses = $derived(
		mdSize !== undefined && mdSize !== size
			? `${CLASSES[size].box} ${CLASSES[size].text} ${CLASSES[mdSize].mdBox} ${CLASSES[mdSize].mdText}`
			: `${CLASSES[size].box} ${CLASSES[size].text}`
	);
</script>

<span
	class={cn(
		'inline-flex shrink-0 items-center justify-center rounded-full bg-avatar font-semibold text-avatar-foreground',
		sizeClasses,
		className
	)}
	aria-hidden="true">{initialsOf(name)}</span
>
