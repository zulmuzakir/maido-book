<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CustomerForm from '#lib/components/customer-form.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const save = new FormAction(({ update }) => update({ reset: false }));

	const values = $derived(form?.values ?? { name: '', phone: '', dosePerDay: '1', notes: '' });

	// Paper draws the form actions at 44px and 13px on every breakpoint.
	const ACTION = 'h-11 px-3.5 text-ui font-semibold desk:h-11';
	const errors = $derived((form?.errors ?? {}) as Record<string, string | undefined>);
	const duplicateOf = $derived(form?.duplicateOf ?? null);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		variant="centered"
		back={{ href: resolve('/(app)/customers'), label: m.nav_customers(), mobileLabel: m.back() }}
	/>

	<div class="page-frame md:px-7">
		<form
			method="post"
			use:enhance={save.enhance}
			class="space-y-[18px] md:max-w-[520px] xl:max-w-[560px]"
		>
			<input type="hidden" name="from" value={data.next} />

			<CustomerForm {values} {errors} {duplicateOf} idPrefix="new-customer" />

			<div class="flex flex-wrap gap-2">
				<Button type="submit" name="next" value="order" class={ACTION} disabled={save.pending}>
					<PlusIcon class="size-[15px]" />
					{m.customer_form_save_order()}
				</Button>
				<Button type="submit" variant="outline" class={ACTION} disabled={save.pending}
					>{m.save()}</Button
				>
			</div>
		</form>
	</div>
</div>
