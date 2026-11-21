<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import CustomerDeleteDialog from '#lib/components/customer-delete-dialog.svelte';
	import StockText from '#lib/components/stock-text.svelte';
	import { customerStatusLabel } from '#lib/labels.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { formatPhone, waLink } from '#lib/domain/phone.ts';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageData } from './$types';

	let {
		customer,
		latest,
		panelItem,
		today,
		leadDays
	}: {
		customer: PageData['customer'];
		latest: PageData['orders'][number] | null;
		panelItem: PageData['panelItem'];
		today: string;
		leadDays: number;
	} = $props();

	const daysLeft = $derived(latest ? supplyStatus({ ...latest, today }).daysLeft : null);
	const editHref = $derived(resolve('/(app)/customers/[id]/edit', { id: customer.id }));
	const backHref = resolve('/(app)/customers');

	const sentAction = new FormAction();
	let sentForm: HTMLFormElement | undefined = $state();
	let deleteOpen = $state(false);

	function openWhatsApp() {
		if (!panelItem) {
			window.open(waLink(customer.phone), '_blank', 'noopener');
			return;
		}
		window.open(panelItem.waUrl, '_blank', 'noopener');
		sentForm?.requestSubmit();
	}

	async function copyPhone() {
		try {
			await navigator.clipboard.writeText(`+${customer.phone}`);
			toast.success(m.phone_copied());
		} catch {
			// Clipboard is blocked (permission, insecure context): show the number so it can be copied by hand.
			toast.error(m.phone_copy_failed({ phone: formatPhone(customer.phone) }));
		}
	}
</script>

{#snippet menu(triggerClass: string)}
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant="ghost"
					size="icon"
					aria-label={m.customer_action_more()}
					class={triggerClass}
				>
					<EllipsisIcon class="size-5" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="end" class="min-w-48">
			<DropdownMenu.Group>
				<!-- A real link, so it can open in a new tab like any other. -->
				<DropdownMenu.Item>
					{#snippet child({ props })}
						<a href={editHref} {...props}>
							<PencilIcon class="size-4" />
							{m.customer_edit_title()}
						</a>
					{/snippet}
				</DropdownMenu.Item>
				<DropdownMenu.Item onSelect={copyPhone}>
					<CopyIcon class="size-4" />
					{m.customer_action_copy()}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
			<DropdownMenu.Separator />
			<DropdownMenu.Group>
				<DropdownMenu.Item variant="destructive" onSelect={() => (deleteOpen = true)}>
					<Trash2Icon class="size-4" />
					{m.customer_delete()}
				</DropdownMenu.Item>
			</DropdownMenu.Group>
		</DropdownMenu.Content>
	</DropdownMenu.Root>
{/snippet}

<!-- Phone: a bar with ‹ and ⋯, the identity block, and the two actions pinned above the bottom
     nav. Tablet: back link, identity, actions as equal halves. Desktop: actions beside the name.
     The ⋯ menu (edit, copy number, delete) sits on the back-link row from md up. -->
<!-- eslint-disable svelte/no-navigation-without-resolve -- tel: link is built from the stored phone -->
<header class="flex flex-col pb-5 md:gap-[22px] md:px-6 md:pt-[18px] md:pb-0 xl:px-8">
	<div class="flex min-h-14 items-center justify-between pr-2 pl-1 md:hidden">
		<a
			href={backHref}
			aria-label={m.back_to({ page: m.nav_customers() })}
			class="grid size-11 place-items-center rounded-md text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring"
		>
			<ChevronLeftIcon class="size-[22px]" aria-hidden="true" />
		</a>
		{@render menu('size-11 text-foreground')}
	</div>
	<div class="hidden items-center justify-between md:flex">
		<a
			href={backHref}
			class="inline-flex items-center gap-1 rounded-sm text-[13.5px] leading-[18px] font-semibold text-primary-text outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
		>
			<ChevronLeftIcon class="size-4" aria-hidden="true" />
			{m.nav_customers()}
		</a>
		{@render menu('-my-2 size-10 text-muted-foreground desk:size-10')}
	</div>

	<div
		class="flex flex-col gap-[22px] px-4 pt-1 md:px-0 md:pt-0 xl:flex-row xl:items-center xl:justify-between"
	>
		<div class="flex min-w-0 items-center gap-3.5 md:gap-4">
			<InitialsAvatar
				name={customer.name}
				size={56}
				class="size-[52px] bg-avatar text-[19px] font-extrabold text-avatar-foreground md:size-14 md:text-xl"
			/>
			<div class="min-w-0">
				<h1
					class="truncate text-[22px] leading-7 font-bold tracking-[-0.02em] md:text-[26px] md:leading-8"
				>
					{customer.name}
				</h1>
				<p class="mt-[3px] text-sm leading-[18px] text-muted-foreground num">
					<a href={`tel:+${customer.phone}`} class="hover:text-foreground hover:underline"
						>{formatPhone(customer.phone)}</a
					>&nbsp;· {customerStatusLabel(customer.status)}
				</p>
				{#if daysLeft !== null && daysLeft < 0}
					<p class="mt-0.5 text-sm leading-[18px] font-semibold text-status-overdue">
						{m.customer_header_stock_out({ count: -daysLeft })}
					</p>
				{:else if latest}
					<p class="mt-0.5 text-sm leading-[18px]">
						<StockText lastOrder={latest} {today} {leadDays} />
					</p>
				{/if}
			</div>
		</div>
		<div
			class="fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] z-10 flex gap-2 border-t border-rule bg-card px-4 py-2.5 shadow-[0_-6px_16px_color-mix(in_oklch,var(--shadow-tint)_5%,transparent)] *:h-12 *:flex-1 md:static md:z-auto md:gap-2.5 md:border-0 md:p-0 md:shadow-none md:*:h-11 xl:shrink-0 xl:*:flex-none desk:*:h-11"
		>
			<Button variant="whatsapp" class="px-2 font-semibold md:px-4" onclick={openWhatsApp}>
				<MessageCircleIcon class="size-[18px]" aria-hidden="true" />
				{m.customer_action_wa()}
			</Button>
			<Button
				variant="outline"
				class="px-2 font-semibold md:px-4"
				href={resolve('/(app)/orders/new') + `?customer=${customer.id}`}
			>
				<PlusIcon class="size-[18px]" aria-hidden="true" />
				{m.new_order()}
			</Button>
		</div>
	</div>
</header>

<form bind:this={sentForm} method="post" action="?/sent" use:enhance={sentAction.enhance} hidden>
	<input type="hidden" name="followUpId" value={panelItem?.followUpId ?? ''} />
</form>

<CustomerDeleteDialog bind:open={deleteOpen} name={customer.name} action="{editHref}?/delete" />
