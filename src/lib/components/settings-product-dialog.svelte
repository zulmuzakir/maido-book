<script lang="ts">
	import { enhance } from '$app/forms';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import ResponsiveDialog from '#lib/components/responsive-dialog.svelte';
	import SettingsProductFields from '#lib/components/settings-product-fields.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { m } from '#lib/paraglide/messages.js';

	let {
		open = $bindable(false),
		errors = {}
	}: {
		open?: boolean;
		errors?: Record<string, string>;
	} = $props();

	const save = new FormAction(async ({ result, update }) => {
		// No reset: hydrated inputs have no default value, so a reset would blank the fields while the
		// dialog closes. The content unmounts on close and reopens with fresh defaults.
		await update({ reset: false });
		if (result.type === 'success') open = false;
	});
</script>

<ResponsiveDialog bind:open title={m.settings_product_new()}>
	<form
		id="settings-product-form"
		method="post"
		action="?/createProduct"
		use:enhance={save.enhance}
	>
		<SettingsProductFields idPrefix="product-new" {errors} />
	</form>

	{#snippet footer()}
		<Button variant="outline" class="w-full sm:w-auto" onclick={() => (open = false)}>
			{m.cancel()}
		</Button>
		<Button
			type="submit"
			form="settings-product-form"
			class="w-full sm:w-auto"
			disabled={save.pending}
		>
			{m.save()}
		</Button>
	{/snippet}
</ResponsiveDialog>
