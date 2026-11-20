<script lang="ts">
	import { resolve } from '$app/paths';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserIcon from '@lucide/svelte/icons/user';
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { searchDigits, formatPhone } from '#lib/domain/phone.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	type CustomerOption = { id: string; name: string; phone: string; dosePerDay: number };

	let {
		id,
		customers,
		value = $bindable(''),
		invalid = false,
		onselect
	}: {
		id: string;
		customers: CustomerOption[];
		value?: string;
		invalid?: boolean;
		onselect?: (customer: CustomerOption) => void;
	} = $props();

	let open = $state(false);
	let query = $state('');

	const selected = $derived(customers.find((c) => c.id === value) ?? null);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return customers;
		const digits = searchDigits(query);
		return customers.filter(
			(c) => c.name.toLowerCase().includes(q) || (digits !== null && c.phone.includes(digits))
		);
	});

	// Rendering every customer (imports bring thousands) stalls the popover on phones.
	const LIMIT = 50;
	const shown = $derived(filtered.slice(0, LIMIT));

	function choose(customer: CustomerOption) {
		value = customer.id;
		open = false;
		query = '';
		onselect?.(customer);
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		{id}
		type="button"
		role="combobox"
		aria-expanded={open}
		aria-invalid={invalid ? 'true' : undefined}
		class={cn(
			buttonVariants({ variant: 'outline', size: 'default' }),
			'h-11 w-full justify-start gap-2.5 rounded-lg px-3 text-[15px] font-normal aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 desk:h-11 desk:px-3 desk:text-[15px]'
		)}
	>
		{#if selected}
			<UserIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="min-w-0 flex-1 truncate text-left">
				{selected.name}<span class="text-foreground num">&nbsp;· {formatPhone(selected.phone)}</span
				>
			</span>
			<span class="shrink-0 text-[13.5px] font-semibold text-primary-text" aria-hidden="true"
				>{m.order_customer_change()}</span
			>
		{:else}
			<SearchIcon class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="text-muted-foreground">{m.order_customer_choose()}</span>
		{/if}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-(--bits-popover-anchor-width) min-w-72 p-0">
		<Command.Root shouldFilter={false}>
			<div class="border-b border-rule p-1">
				<Command.Input bind:value={query} placeholder={m.order_customer_search()} />
			</div>
			<Command.List class="max-h-72">
				{#if filtered.length === 0}
					<p class="px-3 py-3 text-sm text-muted-foreground">{m.order_customer_none()}</p>
				{/if}
				{#each shown as customer (customer.id)}
					<Command.Item
						value={customer.id}
						onSelect={() => choose(customer)}
						class="min-h-11 rounded-none border-b border-rule px-3 py-2.5 last:border-b-0 desk:min-h-0"
					>
						<span class="flex min-w-0 flex-1 items-baseline justify-between gap-3">
							<span class="truncate font-medium">{customer.name}</span>
							<span class="shrink-0 text-sm text-muted-foreground num">
								{formatPhone(customer.phone)}
							</span>
						</span>
					</Command.Item>
				{/each}
				{#if filtered.length > LIMIT}
					<p class="px-3 py-2 text-xs text-muted-foreground">
						{m.order_customer_more({ shown: LIMIT, total: filtered.length })}
					</p>
				{/if}
				<Command.LinkItem
					href={`${resolve('/(app)/customers/new')}?next=order`}
					class="min-h-11 rounded-none border-t border-rule px-3 py-2.5 desk:min-h-0"
				>
					<span class="font-medium text-primary-text">{m.order_customer_add()}</span>
				</Command.LinkItem>
			</Command.List>
		</Command.Root>
	</Popover.Content>
</Popover.Root>
