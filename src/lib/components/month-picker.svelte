<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import XIcon from '@lucide/svelte/icons/x';
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
		variant = 'nav',
		class: className
	}: {
		month: string;
		today: string;
		hrefFor: (month: string) => string;
		variant?: 'nav' | 'select';
		class?: string;
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
		'inline-flex h-full w-11 shrink-0 items-center justify-center outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring';
	const yearButton =
		'inline-flex size-11 items-center justify-center rounded-md border border-border bg-card outline-none enabled:hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring disabled:text-disabled-foreground desk:size-10';
	const capName = $derived(formatMonth(cap, locale, 'longName'));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<!-- Bordered month tiles; the current month is labelled "bulan ini", months after the cap are
     greyed out, and a note says why. -->
{#snippet grid()}
	<div class="flex flex-col gap-2.5">
		<div class="flex items-center justify-between">
			<button
				type="button"
				class={yearButton}
				aria-label={m.previous()}
				onclick={() => (pagedYear = year - 1)}
			>
				<ChevronLeftIcon class="size-4" />
			</button>
			<span class="text-base font-bold num">{year}</span>
			<button
				type="button"
				class={yearButton}
				aria-label={m.next()}
				disabled={year >= capYear}
				onclick={() => (pagedYear = year + 1)}
			>
				<ChevronRightIcon class="size-4" />
			</button>
		</div>
		<div class="grid grid-cols-3 gap-2">
			{#each cells as cell (cell.key)}
				{#if cell.disabled}
					<span
						class="inline-flex h-12 items-center justify-center rounded-lg border border-rule bg-muted text-[15px] font-medium text-disabled-foreground md:h-11"
						aria-disabled="true">{cell.label}</span
					>
				{:else}
					<a
						href={hrefFor(cell.key)}
						onclick={() => setOpen(false)}
						aria-current={cell.key === month ? 'true' : undefined}
						class={cn(
							'inline-flex h-12 flex-col items-center justify-center rounded-lg border text-[15px] leading-4 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring md:h-11',
							cell.key === month
								? 'border-primary bg-primary font-semibold text-primary-foreground'
								: cell.key === current
									? 'border-foreground/70 font-semibold hover:bg-muted'
									: 'border-border bg-card hover:bg-muted'
						)}
						>{cell.label}{#if cell.key === current && cell.key !== month}<span
								class="text-[10.5px] leading-3 font-medium text-primary-text"
								>{m.month_picker_current()}</span
							>{/if}</a
					>
				{/if}
			{/each}
		</div>
		<p class="text-[12.5px] text-muted-foreground">{m.month_picker_cap({ month: capName })}</p>
	</div>
{/snippet}

{#snippet trigger(props: Record<string, unknown>)}
	<button
		type="button"
		{...props}
		class="inline-flex h-full min-w-[150px] flex-1 items-center justify-center gap-1.5 border-x border-rule px-3 text-[14.5px] font-semibold outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-inset"
	>
		<CalendarIcon class="size-4" aria-hidden="true" />
		{formatMonth(month, locale, 'long')}
		<ChevronDownIcon class="size-[15px]" aria-hidden="true" />
	</button>
{/snippet}

{#snippet selectTrigger(props: Record<string, unknown>)}
	<button
		type="button"
		{...props}
		class="inline-flex size-11 items-center justify-center gap-2 rounded-md text-foreground outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring md:h-10 md:w-auto md:border md:border-input md:bg-card md:px-4 md:text-sm md:font-semibold"
	>
		<CalendarIcon class="size-5 md:size-[17px]" aria-hidden="true" />
		<!-- Phone: the calendar icon alone; the month stays its accessible name. -->
		<span class="sr-only md:not-sr-only">{formatMonth(month, locale, 'long')}</span>
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
				class="w-[320px] rounded-[12px] border border-rule p-3.5 shadow-[0px_8px_24px_color-mix(in_oklch,var(--shadow-tint)_14%,transparent)] ring-0"
				align="center">{@render grid()}</Popover.Content
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
						<Drawer.Title class="text-[18px] leading-[22px] font-bold"
							>{m.month_picker_title()}</Drawer.Title
						>
						<div class="flex items-center gap-1">
							{#if month !== current}
								<a
									href={hrefFor(current)}
									onclick={() => setOpen(false)}
									class="inline-flex h-11 items-center px-2 text-sm font-semibold text-primary-text"
									>{m.orders_this_month()}</a
								>
							{/if}
							<Drawer.Close
								class="grid size-11 place-items-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring"
								aria-label={m.close()}
							>
								<XIcon class="size-5" aria-hidden="true" />
							</Drawer.Close>
						</div>
					</div>
					{@render grid()}
				</div>
			</Drawer.Content>
		</Drawer.Root>
	{/if}
{/snippet}

<!-- ‹ | 📅 November 2026 ⌄ | ›, each a bordered cell. The page places "Bulan ini" itself. -->
{#if variant === 'nav'}
	<div
		class={cn(
			'inline-flex h-11 items-center overflow-hidden rounded-lg border border-border bg-card text-foreground desk:h-10',
			className
		)}
	>
		<a href={hrefFor(prev)} class={navButton} aria-label={m.previous()}>
			<ChevronLeftIcon class="size-[18px]" />
		</a>
		{@render picker()}
		{#if nextDisabled}
			<span class={cn(navButton, 'text-disabled-foreground')} aria-disabled="true">
				<ChevronRightIcon class="size-[18px]" />
			</span>
		{:else}
			<a href={hrefFor(next)} class={navButton} aria-label={m.next()}>
				<ChevronRightIcon class="size-[18px]" />
			</a>
		{/if}
	</div>
{:else}
	<div class={className}>{@render picker()}</div>
{/if}
