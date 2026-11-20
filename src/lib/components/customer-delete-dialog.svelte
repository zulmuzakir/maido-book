<script lang="ts">
	import { enhance } from '$app/forms';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ResponsiveDialog from '#lib/components/responsive-dialog.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';

	let {
		open = $bindable(false),
		name,
		action
	}: {
		open?: boolean;
		name: string;
		/** The delete form action, e.g. `/customers/x/edit?/delete`. */
		action: string;
	} = $props();
</script>

<!-- One confirmation for deleting a customer, from the edit page or the detail page's menu. -->
<ResponsiveDialog bind:open confirm title={m.customer_delete_title({ name })}>
	{#snippet icon()}
		<span
			class="grid size-11 place-items-center rounded-full bg-alert text-destructive"
			aria-hidden="true"
		>
			<Trash2Icon class="size-5" />
		</span>
	{/snippet}
	<p class="text-sm leading-[21px] text-muted-foreground">{m.customer_delete_description()}</p>
	{#snippet footer()}
		<div class="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
			<Button
				variant="outline"
				class="h-12 w-full font-semibold md:h-11 md:w-auto desk:h-11"
				onclick={() => (open = false)}
			>
				{m.cancel()}
			</Button>
			<form method="post" {action} use:enhance class="contents">
				<Button
					type="submit"
					variant="destructive-solid"
					class="h-12 w-full font-semibold md:h-11 md:w-auto desk:h-11"
				>
					{m.customer_delete()}
				</Button>
			</form>
		</div>
	{/snippet}
</ResponsiveDialog>
