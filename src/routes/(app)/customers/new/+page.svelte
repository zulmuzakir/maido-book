<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CustomerForm from '#lib/components/customer-form.svelte';
	import FormActions from '#lib/components/form-actions.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import { formColumn } from '#lib/styles.ts';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const save = new FormAction(({ update }) => update({ reset: false }));

	const values = $derived(form?.values ?? { name: '', phone: '', dosePerDay: '1', notes: '' });

	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	const duplicateOf = $derived(form?.duplicateOf ?? null);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		variant="subpage"
		back={{ href: resolve('/(app)/customers'), label: m.nav_customers(), mobileLabel: m.back() }}
	/>

	<div class="page-frame md:px-7">
		<form method="post" use:enhance={save.enhance} class={formColumn}>
			<input type="hidden" name="from" value={data.next} />

			<CustomerForm {values} {errors} {duplicateOf} idPrefix="new-customer" />

			<FormActions>
				<Button size="lg" type="submit" name="next" value="order" disabled={save.pending}>
					<PlusIcon />
					{m.customer_form_save_order()}
				</Button>
				<Button size="lg" type="submit" variant="outline" disabled={save.pending}>{m.save()}</Button
				>
			</FormActions>
		</form>
	</div>
</div>
