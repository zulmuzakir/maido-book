<script lang="ts">
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import SearchIcon from '@lucide/svelte/icons/search';
	import UserIcon from '@lucide/svelte/icons/user';
	import * as Command from '#lib/components/ui/command/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { buttonVariants } from '#lib/components/ui/button/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { formatPhone } from '#lib/domain/phone.ts';
	import type { CustomerOption } from '#lib/domain/types.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { cn } from '#lib/utils.js';

	let {
		id,
		initial = null,
		value = $bindable(''),
		invalid = false,
		onselect
	}: {
		id: string;
		/** The customer already chosen when the page opens (`?customer=`). */
		initial?: CustomerOption | null;
		value?: string;
		invalid?: boolean;
		onselect?: (customer: CustomerOption) => void;
	} = $props();

	/** Wait after the last keystroke before searching. */
	const DEBOUNCE_MS = 200;

	let open = $state(false);
	let query = $state('');
	let selected = $state.raw<CustomerOption | null>(untrack(() => initial));

	// The server searches (an import can bring thousands of customers); only matches come back.
	let results = $state.raw<CustomerOption[]>([]);
	let more = $state(false);
	let loading = $state(false);
	let failed = $state(false);
	/** The query `results` belong to; null before the first answer. */
	let shownFor = $state<string | null>(null);

	let controller: AbortController | undefined;
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function search(q: string) {
		clearTimeout(timer);
		controller?.abort();
		const current = (controller = new AbortController());
		loading = true;
		try {
			const res = await fetch(
				`${resolve('/(app)/orders/new/customers')}?q=${encodeURIComponent(q)}`,
				{ signal: current.signal }
			);
			if (!res.ok) throw new Error(`customer search failed: ${res.status}`);
			const body: { items: CustomerOption[]; more: boolean } = await res.json();
			results = body.items;
			more = body.more;
			shownFor = q;
			failed = false;
		} catch {
			// A newer search replaced this one; it owns the state now.
			if (current.signal.aborted) return;
			failed = true;
		} finally {
			if (controller === current) loading = false;
		}
	}

	function setQuery(next: string) {
		query = next;
		clearTimeout(timer);
		const q = next.trim();
		if (q === '') search('');
		else timer = setTimeout(() => search(q), DEBOUNCE_MS);
	}

	function onOpenChange(isOpen: boolean) {
		if (isOpen && shownFor !== query.trim()) search(query.trim());
	}

	function choose(customer: CustomerOption) {
		selected = customer;
		value = customer.id;
		open = false;
		query = '';
		onselect?.(customer);
	}
</script>

<Popover.Root bind:open {onOpenChange}>
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
		{#if selected && selected.id === value}
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
			<div class="relative border-b border-rule p-1">
				<Command.Input bind:value={() => query, setQuery} placeholder={m.order_customer_search()} />
				{#if loading}
					<Spinner
						class="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
						aria-hidden="true"
					/>
				{/if}
			</div>
			<Command.List class="max-h-72" aria-busy={loading}>
				{#if failed}
					<p class="px-3 py-3 text-sm text-destructive" role="alert">
						{m.order_customer_error()}
					</p>
				{:else if shownFor !== null && !loading && results.length === 0}
					<p class="px-3 py-3 text-sm text-muted-foreground">{m.order_customer_none()}</p>
				{/if}
				{#each results as customer (customer.id)}
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
				{#if more}
					<p class="px-3 py-2 text-xs text-muted-foreground">{m.order_customer_refine()}</p>
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
