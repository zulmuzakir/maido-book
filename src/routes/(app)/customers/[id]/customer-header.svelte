<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import { Button } from '#lib/components/ui/button/index.js';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import { customerStatusLabel } from '#lib/labels.ts';
	import StockText from '#lib/components/stock-text.svelte';
	import WhatsappIcon from '#lib/components/whatsapp-icon.svelte';
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

	const sentAction = new FormAction();
	let sentForm: HTMLFormElement | undefined = $state();

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

<!-- eslint-disable svelte/no-navigation-without-resolve -- tel: link is built from the stored phone -->
<header
	class="flex flex-col gap-3.5 border-b border-rule px-4 pt-1.5 pb-4 md:px-6 md:pt-4 md:pb-[18px] xl:px-7"
>
	<a
		href={resolve('/(app)/customers')}
		class="inline-flex items-center gap-1.5 text-ui font-medium text-ink"
	>
		<ChevronLeftIcon class="size-4" aria-hidden="true" />
		{m.nav_customers()}
	</a>
	<div class="flex flex-col gap-3.5 md:flex-row md:items-center md:justify-between">
		<div class="flex min-w-0 items-center gap-3 md:gap-3.5">
			<span class="block md:hidden">
				<InitialsAvatar name={customer.name} size={48} class="text-ui font-semibold" />
			</span>
			<span class="hidden md:block">
				<InitialsAvatar name={customer.name} size={56} class="text-ui font-semibold" />
			</span>
			<div class="min-w-0">
				<h1
					class="truncate text-[20px] leading-6 font-bold tracking-[-0.03em] md:text-[22px] md:leading-[1.1] xl:text-2xl"
				>
					{customer.name}
				</h1>
				<p
					class="mt-1 flex flex-wrap items-center gap-x-1 text-[13px] leading-4 text-muted-foreground md:mt-[5px]"
				>
					<span class="inline-flex items-center gap-1 num">
						<a href={`tel:+${customer.phone}`} class="hover:text-foreground hover:underline"
							>{formatPhone(customer.phone)}</a
						>
						<button
							type="button"
							aria-label={m.customer_action_copy()}
							title={m.customer_action_copy()}
							onclick={copyPhone}
							class="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-subtle hover:text-foreground desk:size-6"
						>
							<CopyIcon class="size-3.5" aria-hidden="true" />
						</button>
					</span>
					<span aria-hidden="true">·</span>
					<span>{customerStatusLabel(customer.status)}</span>
					<span aria-hidden="true">·</span>
					{#if daysLeft !== null && daysLeft < 0}
						<span class="font-semibold text-status-overdue"
							>{m.customer_header_stock_out({ count: -daysLeft })}</span
						>
					{:else}
						<StockText lastOrder={latest} {today} {leadDays} />
					{/if}
				</p>
			</div>
		</div>
		<div class="flex w-full items-center gap-2 md:w-auto md:shrink-0">
			<Button
				variant="whatsapp"
				class="h-11 flex-1 text-sm font-semibold md:h-10 md:flex-none md:px-3.5 md:text-ui desk:h-10"
				onclick={openWhatsApp}
			>
				<WhatsappIcon class="size-4" />
				{m.customer_action_wa()}
			</Button>
			<Button
				variant="outline"
				class="h-11 w-[120px] text-sm font-semibold md:h-10 md:w-auto md:px-3.5 md:text-ui desk:h-10"
				href={resolve('/(app)/orders/new') + `?customer=${customer.id}`}
			>
				{m.new_order()}
			</Button>
		</div>
	</div>
</header>

<form bind:this={sentForm} method="post" action="?/sent" use:enhance={sentAction.enhance} hidden>
	<input type="hidden" name="followUpId" value={panelItem?.followUpId ?? ''} />
</form>
