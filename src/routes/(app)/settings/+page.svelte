<script lang="ts">
	import SectionHeading from '#lib/components/section-heading.svelte';
	import FieldError from '#lib/components/field-error.svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { toast } from 'svelte-sonner';
	import { m } from '#lib/paraglide/messages.js';
	import { fieldError, followUpKindLabel } from '#lib/labels.ts';
	import { FOLLOW_UP_KINDS, type TemplateKind } from '#lib/domain/types.ts';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Switch } from '#lib/components/ui/switch/index.js';
	import * as Tabs from '#lib/components/ui/tabs/index.js';
	import FilterTabs from '#lib/components/filter-tabs.svelte';
	import PageHeader from '#lib/components/page-header.svelte';
	import SettingsProductDialog from '#lib/components/settings-product-dialog.svelte';
	import SettingsProductFields from '#lib/components/settings-product-fields.svelte';
	import SettingsTemplateField from '#lib/components/settings-template-field.svelte';
	import SettingsSectionNav from './settings-section-nav.svelte';
	import Database from '@lucide/svelte/icons/database';
	import MessageSquareText from '@lucide/svelte/icons/message-square-text';
	import Package from '@lucide/svelte/icons/package';
	import Plus from '@lucide/svelte/icons/plus';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Upload from '@lucide/svelte/icons/upload';

	let { data, form }: PageProps = $props();

	type FormResult = {
		ok?: boolean;
		action?: string;
		productId?: string;
		errors?: Record<string, string>;
	};
	const result = $derived(form as FormResult | null | undefined);

	/** Field errors for one action only, translated. Empty unless this action failed. */
	function errorsFor(action: string): Record<string, string> {
		if (!result || result.ok || result.action !== action || !result.errors) return {};
		return Object.fromEntries(
			Object.entries(result.errors).map(([field, code]) => [field, fieldError(field, code) ?? ''])
		);
	}

	/** Errors for one inline product form: only the product whose save failed shows them. */
	function productErrorsFor(productId: string): Record<string, string> {
		return result?.productId === productId ? errorsFor('updateProduct') : {};
	}

	// Success and the Aktif switch's last-product error are toasted here, so they also cover no-JS posts.
	$effect(() => {
		const r = result;
		if (!r) return;
		if (r.ok) {
			if (r.action === 'rules') toast.success(m.settings_saved_rules());
			else if (r.action === 'templates') toast.success(m.settings_saved_templates());
			else toast.success(m.settings_saved_product());
		} else if (r.action === 'updateProduct' && r.errors?.active) {
			toast.error(m.error_last_active());
		}
	});

	// Product create dialog
	let productDialogOpen = $state(false);
	const createErrors = $derived(errorsFor('createProduct'));

	// Rules
	let rules = $state(
		untrack(() => ({
			leadDays: String(data.rules.leadDays),
			retryDays: String(data.rules.retryDays),
			maxAttempts: String(data.rules.maxAttempts),
			winbackDays: String(data.rules.winbackDays)
		}))
	);
	const rulesErrors = $derived(errorsFor('rules'));

	const ruleFields = $derived([
		{ key: 'leadDays' as const, label: m.settings_rule_lead(), unit: m.settings_unit_days() },
		{ key: 'retryDays' as const, label: m.settings_rule_retry(), unit: m.settings_unit_days() },
		{
			key: 'maxAttempts' as const,
			label: m.settings_rule_attempts(),
			unit: m.settings_unit_times()
		},
		{ key: 'winbackDays' as const, label: m.settings_rule_winback(), unit: m.settings_unit_days() }
	]);

	// Templates
	let templates = $state<Record<TemplateKind, string>>(untrack(() => ({ ...data.templates })));
	const templateErrors = $derived(errorsFor('templates'));
	const sample = $derived({
		nama: m.settings_sample_name(),
		produk: data.productName,
		cs: data.csName
	});
	let activeKind = $state<string>(FOLLOW_UP_KINDS[0]);

	// One shared pending flag per form group; every submit carries the current values.
	const productAction = new FormAction();
	const rulesAction = new FormAction();
	const templatesAction = new FormAction();

	type SectionId = 'products' | 'rules' | 'templates' | 'data';
	const sections: { id: SectionId; label: () => string; icon: typeof Package }[] = [
		{ id: 'products', label: () => m.settings_products(), icon: Package },
		{ id: 'rules', label: () => m.settings_rules(), icon: SlidersHorizontal },
		{ id: 'templates', label: () => m.settings_templates(), icon: MessageSquareText },
		{ id: 'data', label: () => m.settings_data(), icon: Database }
	];
	const sectionItems = $derived(sections.map((s) => ({ key: s.id, label: s.label() })));

	let activeId = $state<SectionId>('products');

	// Scroll-spy: the section crossing the upper-middle band of the viewport is the active one.
	$effect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) activeId = entry.target.id as SectionId;
				}
			},
			{ rootMargin: '-40% 0px -55% 0px' }
		);
		for (const s of sections) {
			const el = document.getElementById(s.id);
			if (el) observer.observe(el);
		}
		return () => observer.disconnect();
	});

	function go(id: string) {
		activeId = id as SectionId;
		document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}

	const sectionClass =
		'scroll-mt-4 flex flex-col gap-3.5 border-b border-row-rule px-4 py-6 md:px-6 xl:px-10';
</script>

<svelte:head>
	<title>{m.nav_settings()}</title>
</svelte:head>

<div class="min-h-dvh bg-card">
	<PageHeader title={m.nav_settings()} metaInline="md">
		{#snippet meta()}{m.settings_subtitle()}{/snippet}
	</PageHeader>

	<div class="xl:grid xl:grid-cols-[232px_minmax(0,1fr)]">
		<SettingsSectionNav {sections} active={activeId} ongo={go} />

		<div class="min-w-0 max-md:border-t max-md:border-rule">
			<div class="hidden px-6 md:block md:border-b md:border-rule md:px-5 xl:hidden">
				<FilterTabs items={sectionItems} active={activeId} onselect={go} label={m.nav_settings()} />
			</div>

			<section id="products" class={sectionClass} aria-labelledby="settings-products-heading">
				<SectionHeading
					id="settings-products-heading"
					title={m.settings_products()}
					description={m.settings_products_hint()}
					size="sm"
					class="items-center"
				>
					{#snippet actions()}
						<Button variant="outline" onclick={() => (productDialogOpen = true)}>
							<Plus />
							{m.settings_product_add()}
						</Button>
					{/snippet}
				</SectionHeading>

				{#if data.products.length === 0}
					<p class="text-ui text-muted-foreground">{m.settings_products_empty()}</p>
				{/if}

				{#each data.products as p (p.id)}
					{@const errs = productErrorsFor(p.id)}
					<form
						method="post"
						action="?/updateProduct"
						use:enhance={productAction.enhance}
						class="flex flex-col gap-3.5 border-t border-row-rule pt-4 first:border-t-0 first:pt-0"
					>
						<input type="hidden" name="productId" value={p.id} />
						<SettingsProductFields idPrefix={`product-${p.id}`} product={p} errors={errs} />

						<div class="flex h-10 items-center justify-between gap-4">
							<Label for={`product-${p.id}-active`} class="text-ui leading-4 font-semibold"
								>{m.settings_product_active()}</Label
							>
							<Switch
								id={`product-${p.id}-active`}
								name="active"
								checked={p.active}
								class="w-10 data-checked:bg-primary dark:[&>[data-slot=switch-thumb]]:bg-card [&[data-checked]>[data-slot=switch-thumb]]:translate-x-4"
							/>
						</div>
						<FieldError message={errs.active} />

						<div class="flex pt-1">
							<Button type="submit" class="h-9 px-3.5 text-ui" disabled={productAction.pending}
								>{m.save()}</Button
							>
						</div>
					</form>
				{/each}
			</section>

			<section id="rules" class={sectionClass} aria-labelledby="settings-rules-heading">
				<SectionHeading
					id="settings-rules-heading"
					title={m.settings_rules()}
					description={m.settings_rules_hint()}
					size="sm"
				/>

				<form
					method="post"
					action="?/rules"
					use:enhance={rulesAction.enhance}
					class="flex flex-col"
				>
					<div class="grid grid-cols-2 gap-4">
						{#each ruleFields as f (f.key)}
							<div class="space-y-1.5">
								<Label for={f.key} class="text-ui leading-4 font-semibold">{f.label}</Label>
								<div class="relative">
									<Input
										id={f.key}
										name={f.key}
										inputmode="numeric"
										autocomplete="off"
										bind:value={rules[f.key]}
										class="h-10 pr-12 text-base num md:text-sm desk:h-10"
										aria-invalid={!!rulesErrors[f.key]}
									/>
									<span
										class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ui text-muted-foreground"
										>{f.unit}</span
									>
								</div>
								<FieldError message={rulesErrors[f.key]} />
							</div>
						{/each}
					</div>

					<div class="flex pt-1">
						<Button type="submit" class="h-9 px-3.5 text-ui" disabled={rulesAction.pending}
							>{m.settings_rules_save()}</Button
						>
					</div>
				</form>
			</section>

			<section id="templates" class={sectionClass} aria-labelledby="settings-templates-heading">
				<SectionHeading
					id="settings-templates-heading"
					title={m.settings_templates()}
					description={m.settings_templates_hint()}
					size="sm"
				/>

				<Tabs.Root bind:value={activeKind} class="gap-4">
					<Tabs.List
						variant="line"
						class="h-auto w-full justify-start gap-3.5 overflow-x-auto p-0 group-data-horizontal/tabs:h-auto xl:gap-[18px] xl:group-data-horizontal/tabs:h-auto"
					>
						{#each FOLLOW_UP_KINDS as kind (kind)}
							<Tabs.Trigger
								value={kind}
								class="flex-none px-0 py-2 group-data-horizontal/tabs:after:bottom-0 dark:after:bg-accent-foreground"
								>{followUpKindLabel(kind)}</Tabs.Trigger
							>
						{/each}
					</Tabs.List>

					<!-- Every field stays in the form; inactive ones are hidden, so all five bodies post. -->
					<form
						method="post"
						action="?/templates"
						use:enhance={templatesAction.enhance}
						class="flex flex-col gap-5"
					>
						{#each FOLLOW_UP_KINDS as kind (kind)}
							<div hidden={activeKind !== kind}>
								<SettingsTemplateField
									id={`template-${kind}`}
									name={kind}
									label={followUpKindLabel(kind)}
									bind:value={templates[kind]}
									error={templateErrors[kind]}
									{sample}
								/>
							</div>
						{/each}

						<div class="flex pt-1">
							<Button type="submit" class="h-9 px-3.5 text-ui" disabled={templatesAction.pending}>
								{m.settings_templates_save()}
							</Button>
						</div>
					</form>
				</Tabs.Root>
			</section>

			<section id="data" class={sectionClass} aria-labelledby="settings-data-heading">
				<SectionHeading id="settings-data-heading" title={m.settings_data()} size="sm" />
				<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-ui text-muted-foreground">{m.settings_data_hint()}</p>
					<Button variant="outline" href={resolve('/(app)/import')} class="w-full sm:w-auto">
						<Upload />
						{m.settings_import()}
					</Button>
				</div>
			</section>
		</div>
	</div>
</div>

<SettingsProductDialog bind:open={productDialogOpen} errors={createErrors} />
