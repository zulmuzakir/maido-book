<script lang="ts">
	import { bucketLabel, customerStatusLabel, followUpKindLabel } from '#lib/labels.ts';
	import type { QueueBucket } from '#lib/domain/follow-up.ts';
	import type { CustomerStatus, FollowUpKind } from '#lib/domain/types.ts';
	import { cn } from '#lib/utils.js';

	let {
		kind,
		value,
		class: className
	}: {
		kind: 'customer' | 'bucket' | 'followUpKind';
		value: string;
		class?: string;
	} = $props();

	const tone = $derived.by(() => {
		if (kind === 'customer')
			return (
				{
					lead: 'text-status-lead',
					active: 'text-status-done',
					dormant: 'text-muted-foreground'
				}[value] ?? 'text-muted-foreground'
			);
		if (kind === 'bucket')
			return (
				{
					overdue: 'text-status-overdue',
					today: 'text-status-today',
					waiting: 'text-status-waiting',
					upcoming: 'text-muted-foreground'
				}[value] ?? 'text-muted-foreground'
			);
		return 'text-secondary-foreground';
	});
	const text = $derived(
		kind === 'customer'
			? customerStatusLabel(value as CustomerStatus)
			: kind === 'bucket'
				? bucketLabel(value as QueueBucket)
				: followUpKindLabel(value as FollowUpKind)
	);
</script>

<span class={cn('font-semibold whitespace-nowrap', tone, className)}>{text}</span>
