<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CustomerDeleteDialog from '#lib/components/customer-delete-dialog.svelte';
	import CustomerForm from '#lib/components/customer-form.svelte';
	import CustomerSidePanel from '#lib/components/customer-side-panel.svelte';
	import FormActions from '#lib/components/form-actions.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import BusyLabel from '#lib/components/busy-label.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const save = new FormAction(({ update }) => update({ reset: false }));

	let deleteOpen = $state(false);

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

<!-- Same frame as Pelanggan baru; the panel summarises the customer (or the one who already has the
     typed number), and deleting sits in its own danger-zone card under the form. -->
<div class="min-h-dvh bg-card">
	<PageHeader
		title={data.title}
		variant="subpage"
		back={{ href: detailHref, label: m.nav_customers(), mobileLabel: m.back() }}
		class="md:px-[max(24px,calc((100%-600px)/2))] xl:px-[calc((100%-960px)/2)]"
	/>

	<div class="px-4 pt-3 pb-[96px] md:px-6 md:pt-7 md:pb-8">
		<div
			class="mx-auto max-w-[600px] xl:grid xl:w-fit xl:max-w-none xl:grid-cols-[560px_360px] xl:items-start xl:gap-x-10"
		>
			<div class="flex flex-col gap-8">
				<form
					id="customer-edit-form"
					method="post"
					action="?/update"
					class="flex flex-col gap-6"
					use:enhance={save.enhance}
				>
					<CustomerForm {values} {errors} {duplicateOf} idPrefix="edit-customer" />

					<FormActions>
						<Button size="lg" type="submit" disabled={save.pending} aria-busy={save.pending}>
							<BusyLabel busy={save.pending}>{m.customer_save_changes()}</BusyLabel>
						</Button>
						<Button size="lg" variant="outline" href={detailHref}>{m.cancel()}</Button>
					</FormActions>
				</form>

				<section
					class="flex items-center justify-between gap-4 rounded-[8px] border border-alert-border px-4 py-3.5"
				>
					<div class="min-w-0">
						<h2 class="text-[14.5px] leading-5 font-semibold">{m.customer_delete()}</h2>
						<p class="text-[13.5px] leading-5 text-muted-foreground">
							{m.customer_delete_zone_body()}
						</p>
					</div>
					<Button
						type="button"
						variant="destructive-outline"
						class="shrink-0 border-alert-border font-semibold desk:h-10"
						onclick={() => (deleteOpen = true)}
					>
						<Trash2Icon data-icon="inline-start" aria-hidden="true" />
						{m.customer_delete_short()}
					</Button>
				</section>
			</div>

			<CustomerSidePanel
				kind={duplicateOf ? 'duplicate' : 'summary'}
				customer={duplicateOf ?? data.summary}
				today={data.today}
				class="hidden xl:flex"
			/>
		</div>
	</div>
</div>

<CustomerDeleteDialog bind:open={deleteOpen} name={data.customer.name} action="?/delete" />
