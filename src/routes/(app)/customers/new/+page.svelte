<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CustomerForm from '#lib/components/customer-form.svelte';
	import CustomerSidePanel from '#lib/components/customer-side-panel.svelte';
	import FormActions from '#lib/components/form-actions.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const save = new FormAction(({ update }) => update({ reset: false }));

	const values = $derived(form?.values ?? { name: '', phone: '', dosePerDay: '1', notes: '' });

	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	const duplicateOf = $derived(form?.duplicateOf ?? null);

	let liveName = $state('');
	let livePhone = $state('');
	let liveDose = $state<number | null>(1);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<!-- Desktop: a 560px form and a 360px panel (a live preview, or the customer who already has this
     number), centred together. Tablet: a 600px column. Phone: the action bar above the nav. -->
<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		variant="subpage"
		back={{ href: resolve('/(app)/customers'), label: m.nav_customers(), mobileLabel: m.back() }}
		class="md:px-[max(24px,calc((100%-600px)/2))] xl:px-[calc((100%-960px)/2)]"
	/>

	<div class="px-4 pt-3 pb-6 md:px-6 md:pt-7">
		<div
			class="mx-auto max-w-[600px] xl:grid xl:w-fit xl:max-w-none xl:grid-cols-[560px_360px] xl:items-start xl:gap-x-10"
		>
			<form method="post" use:enhance={save.enhance} class="flex flex-col gap-6 pb-[88px] md:pb-0">
				<input type="hidden" name="from" value={data.next} />

				<CustomerForm
					{values}
					{errors}
					{duplicateOf}
					idPrefix="new-customer"
					bind:liveName
					bind:livePhone
					bind:liveDose
				/>

				<FormActions>
					<Button size="lg" type="submit" name="next" value="order" disabled={save.pending}>
						<PlusIcon class="size-[18px]" aria-hidden="true" />
						{m.customer_form_save_order()}
					</Button>
					<Button size="lg" type="submit" variant="outline" disabled={save.pending}>
						{m.customer_save_only()}
					</Button>
				</FormActions>
			</form>

			{#if duplicateOf}
				<CustomerSidePanel
					kind="duplicate"
					customer={duplicateOf}
					today={data.today}
					class="hidden xl:flex"
				/>
			{:else}
				<CustomerSidePanel
					kind="preview"
					name={liveName}
					phone={livePhone}
					dose={liveDose}
					today={data.today}
					class="hidden xl:flex"
				/>
			{/if}
		</div>
	</div>
</div>
