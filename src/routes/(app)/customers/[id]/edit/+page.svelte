<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CustomerForm from '#lib/components/customer-form.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import ResponsiveDialog from '#lib/components/responsive-dialog.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { ActionData, PageData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const save = new FormAction(({ update }) => update({ reset: false }));

	let deleteOpen = $state(false);

	// Paper draws the edit actions at 44px on every breakpoint.
	const ACTION = 'h-11 px-3.5 text-sm font-semibold md:text-ui desk:h-11';

	const detailHref = $derived(resolve('/(app)/customers/[id]', { id: data.customer.id }));

	const prefilled = $derived({
		name: data.customer.name,
		phone: data.customer.phone,
		dosePerDay: String(data.customer.dosePerDay),
		notes: data.customer.notes
	});

	// Only an update failure re-renders the typed values; delete never returns to this page.
	const updateForm = $derived(form?.action === 'update' ? form : null);
	const values = $derived(updateForm?.values ?? prefilled);
	const errors = $derived((updateForm?.errors ?? {}) as Record<string, string | undefined>);
	const duplicateOf = $derived(updateForm?.duplicateOf ?? null);
</script>

<svelte:head>
	<title>{data.title}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		variant="centered"
		back={{ href: detailHref, label: m.nav_customers(), mobileLabel: m.back() }}
	/>

	<div class="page-frame md:px-7">
		<form
			id="customer-edit-form"
			method="post"
			action="?/update"
			class="space-y-[18px] md:max-w-[520px] desk:max-w-[560px]"
			use:enhance={save.enhance}
		>
			<CustomerForm {values} {errors} {duplicateOf} idPrefix="edit-customer" />

			<div class="flex flex-wrap items-center gap-2">
				<Button type="submit" class={ACTION} disabled={save.pending}>{m.save()}</Button>
				<Button variant="outline" class={ACTION} href={detailHref}>{m.cancel()}</Button>
				<Button
					type="button"
					variant="destructive-outline"
					class="ml-auto border-destructive-border {ACTION}"
					onclick={() => (deleteOpen = true)}
				>
					{m.customer_delete()}
				</Button>
			</div>
		</form>
	</div>
</div>

<ResponsiveDialog
	bind:open={deleteOpen}
	confirm
	title={m.customer_delete_title({ name: data.customer.name })}
>
	<p class="text-sm leading-[21px] text-muted-foreground">{m.customer_delete_description()}</p>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
			<Button
				variant="outline"
				class="h-12 w-full text-sm font-semibold md:h-10 md:w-auto md:text-ui desk:h-10"
				onclick={() => (deleteOpen = false)}
			>
				{m.cancel()}
			</Button>
			<form method="post" action="?/delete" use:enhance class="contents">
				<Button
					type="submit"
					variant="destructive-solid"
					class="h-12 w-full text-sm font-semibold md:h-10 md:w-auto md:text-ui desk:h-10"
				>
					{m.customer_delete()}
				</Button>
			</form>
		</div>
	{/snippet}
</ResponsiveDialog>
