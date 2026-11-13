<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import * as Drawer from '#lib/components/ui/drawer/index.js';
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { formatMonth, maxOrderDate, monthKey } from '#lib/domain/dates.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	let {
		month,
		today,
		hrefFor,
		variant = 'nav'
	}: {
		month: string;
		today: string;
		hrefFor: (month: string) => string;
		variant?: 'nav' | 'select';
	} = $props();

	const locale = $derived(getLocale());
	const current = $derived(monthKey(today));
	/** Latest month an order may be dated in: the month of tomorrow. */
	const cap = $derived(monthKey(maxOrderDate(today)));
	const capYear = $derived(Number(cap.slice(0, 4)));
	const shift = (key: string, n: number) => {
		const [y, mo] = key.split('-').map(Number);
		return new Date(Date.UTC(y, mo - 1 + n, 1)).toISOString().slice(0, 7);
	};
	const prev = $derived(shift(month, -1));
	const next = $derived(shift(month, 1));
	const nextDisabled = $derived(month >= cap);

	let open = $state(false);
	/** Year paged to inside the open picker; null shows the year of `month`. */
	let pagedYear = $state<number | null>(null);
	const year = $derived(pagedYear ?? Number(month.slice(0, 4)));
	const cells = $derived(
		Array.from({ length: 12 }, (_, i) => {
			const key = `${year}-${String(i + 1).padStart(2, '0')}`;
			return { key, label: formatMonth(key, locale, 'short'), disabled: key > cap };
		})
	);

	function setOpen(value: boolean) {
		open = value;
		pagedYear = null;
	}

	const wide = new MediaQuery('(min-width: 768px)');
	const navButton =
		'inline-flex h-full w-11 shrink-0 items-center justify-center outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/50 desk:w-[34px]';
	const yearButton =
		'inline-flex size-11 items-center justify-center rounded-md outline-none enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 desk:size-9';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

{#snippet grid()}
	<div class="flex flex-col gap-1.5">
		<div class="flex h-11 items-center justify-between desk:h-9">
			<button
				type="button"
				class={yearButton}
				aria-label={m.previous()}
				onclick={() => (pagedYear = year - 1)}
			>
				<ChevronLeftIcon class="size-4" />
			</button>
			<span class="text-sm font-semibold num">{year}</span>
			<button
				type="button"
				class={cn(yearButton, year >= capYear && 'text-muted-foreground/50')}
				aria-label={m.next()}
				disabled={year >= capYear}
				onclick={() => (pagedYear = year + 1)}
			>
				<ChevronRightIcon class="size-4" />
			</button>
		</div>
		<div class="grid grid-cols-3 gap-1">
			{#each cells as cell (cell.key)}
				{#if cell.disabled}
					<span
						class="inline-flex h-12 items-center justify-center rounded-lg border border-transparent text-sm font-medium text-disabled-foreground md:h-11 desk:h-10 desk:text-[13px]"
						aria-disabled="true">{cell.label}</span
					>
				{:else}
					<a
						href={hrefFor(cell.key)}
						onclick={() => setOpen(false)}
						aria-current={cell.key === month ? 'true' : undefined}
						class={cn(
							'inline-flex h-12 items-center justify-center rounded-lg border text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-11 desk:h-10 desk:text-[13px]',
							cell.key === month
								? 'border-primary bg-primary font-semibold text-primary-foreground'
								: cell.key === current
									? 'border-selected-ring font-semibold text-primary-text hover:bg-muted'
									: 'border-transparent hover:bg-muted'
						)}>{cell.label}</a
					>
				{/if}
			{/each}
		</div>
	</div>
{/snippet}

{#snippet trigger(props: Record<string, unknown>)}
	<button
		type="button"
		{...props}
		class="inline-flex h-full items-center gap-1.5 px-1.5 text-sm font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset desk:px-2 desk:text-ui"
	>
		{formatMonth(month, locale, 'long')}
		<ChevronDownIcon class="size-4 text-muted-foreground desk:size-3.5" aria-hidden="true" />
	</button>
{/snippet}

{#snippet selectTrigger(props: Record<string, unknown>)}
	<button
		type="button"
		{...props}
		class="inline-flex h-9 items-center gap-1.5 rounded-md border border-input bg-card px-3 text-ui font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
	>
		<CalendarIcon class="size-4" aria-hidden="true" />
		{formatMonth(month, locale, 'long')}
	</button>
{/snippet}

{#snippet picker()}
	{#if wide.current}
		<Popover.Root {open} onOpenChange={setOpen}>
			<Popover.Trigger>
				{#snippet child({ props })}{@render (variant === 'select' ? selectTrigger : trigger)(
						props
					)}{/snippet}
			</Popover.Trigger>
			<Popover.Content
				class="w-[340px] gap-1.5 rounded-[8px] border border-rule px-3 pt-2 pb-3 shadow-[0px_8px_24px_#24142024] ring-0 desk:w-[300px]"
				align="end">{@render grid()}</Popover.Content
			>
		</Popover.Root>
	{:else}
		<Drawer.Root {open} onOpenChange={setOpen}>
			<Drawer.Trigger>
				{#snippet child({ props })}{@render (variant === 'select' ? selectTrigger : trigger)(
						props
					)}{/snippet}
			</Drawer.Trigger>
			<Drawer.Content class="data-[vaul-drawer-direction=bottom]:rounded-t-[16px]">
				<div class="flex flex-col gap-2 px-4 pt-2 pb-[calc(1.75rem+env(safe-area-inset-bottom))]">
					<div class="flex h-11 items-center justify-between">
						<Drawer.Title class="text-base leading-5 font-semibold"
							>{m.month_picker_title()}</Drawer.Title
						>
						{#if month !== current}
							<a
								href={hrefFor(current)}
								onclick={() => setOpen(false)}
								class="inline-flex h-11 items-center text-sm font-semibold text-primary-text"
								>{m.orders_this_month()}</a
							>
						{/if}
					</div>
					{@render grid()}
				</div>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/snippet}

<div class="flex items-center gap-1 text-foreground desk:gap-2">
	{#if variant === 'nav' && month !== current}
		<a
			href={hrefFor(current)}
			class="inline-flex h-11 items-center rounded-sm px-3 text-sm font-semibold text-primary-text outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-md:order-last desk:h-9 desk:px-1.5 desk:text-ui"
			>{m.orders_this_month()}</a
		>
	{/if}
	{#if variant === 'nav'}
		<div
			class="inline-flex h-11 items-center overflow-hidden rounded-lg border border-input bg-card dark:border-border desk:h-9"
		>
			<a href={hrefFor(prev)} class={navButton} aria-label={m.previous()}>
				<ChevronLeftIcon class="size-[18px] desk:size-[15px]" />
			</a>
			{@render picker()}
			{#if nextDisabled}
				<span class={cn(navButton, 'text-muted-foreground/50')} aria-disabled="true">
					<ChevronRightIcon class="size-[18px] desk:size-[15px]" />
				</span>
			{:else}
				<a href={hrefFor(next)} class={navButton} aria-label={m.next()}>
					<ChevronRightIcon class="size-[18px] desk:size-[15px]" />
				</a>
			{/if}
		</div>
	{:else}
		{@render picker()}
	{/if}
</div>
