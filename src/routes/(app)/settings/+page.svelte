<script lang="ts">
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
	import Clock from '@lucide/svelte/icons/clock';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Plus from '@lucide/svelte/icons/plus';
	import Receipt from '@lucide/svelte/icons/receipt';
	import Upload from '@lucide/svelte/icons/upload';
	import { cn } from '#lib/utils.js';

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
	// "Closing" here; the queue keeps the longer "Closing (berminat)".
	const templateTabLabel = (kind: (typeof FOLLOW_UP_KINDS)[number]) =>
		kind === 'closing' ? m.settings_kind_closing() : followUpKindLabel(kind);

	// One shared pending flag per form group; every submit carries the current values. A success
	// must not reset the <form>: hydrated inputs have no default value, so a reset would blank them.
	const productAction = new FormAction(({ update }) => update({ reset: false }));
	const rulesAction = new FormAction(({ update }) => update({ reset: false }));
	const templatesAction = new FormAction(({ update }) => update({ reset: false }));

	type SectionId = 'products' | 'rules' | 'templates' | 'data';
	const sections: { id: SectionId; label: () => string; icon: typeof Receipt }[] = [
		{ id: 'products', label: () => m.settings_products(), icon: Receipt },
		{ id: 'rules', label: () => m.settings_rules(), icon: Clock },
		{ id: 'templates', label: () => m.settings_templates(), icon: MessageCircle },
		{ id: 'data', label: () => m.settings_data(), icon: Upload }
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

	// One column: full width on phone, 600px on tablet, 720px centred beside the nav on desktop.
	const sectionClass =
		'scroll-mt-16 flex flex-col gap-[18px] border-b border-rule py-7 last:border-b-0 md:scroll-mt-4';
	// Phone: full width. Tablet/desktop: right-aligned 40px, named per section.
	const SAVE = 'h-12 w-full px-5 text-sm font-semibold md:h-10 md:w-auto desk:h-10';
	const H2 = 'text-[17px] leading-[22px] font-bold tracking-[-0.01em]';
	const HINT = 'mt-0.5 text-sm leading-5 text-muted-foreground';
</script>

{#snippet heading(id: string, title: string, hint?: string)}
	<div>
		<h2 {id} class={H2}>{title}</h2>
		{#if hint}<p class={HINT}>{hint}</p>{/if}
	</div>
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader
		title={m.nav_settings()}
		back={{ href: resolve('/(app)/more'), label: m.nav_more() }}
		variant="subpage"
		backMobileOnly
		metaInline="md"
		class="md:px-[max(24px,calc((100%-600px)/2))] xl:px-8"
	>
		{#snippet meta()}{m.settings_subtitle()}{/snippet}
	</PageHeader>

	<div class="xl:grid xl:grid-cols-[220px_minmax(0,1fr)]">
		<SettingsSectionNav {sections} active={activeId} ongo={go} />

		<div class="min-w-0">
			<!-- Phone: pill chips that scroll to their section. -->
			<nav
				aria-label={m.nav_settings()}
				class="sticky top-0 z-10 -mb-3 flex [scrollbar-width:none] gap-2 overflow-x-auto bg-card px-4 py-2 md:hidden"
			>
				{#each sections as sec (sec.id)}
					<button
						type="button"
						aria-current={activeId === sec.id ? 'true' : undefined}
						onclick={() => go(sec.id)}
						class={cn(
							'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap outline-none focus-visible:ring-3 focus-visible:ring-ring',
							activeId === sec.id
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-border bg-card text-foreground'
						)}>{sec.label()}</button
					>
				{/each}
			</nav>
			<!-- Tablet: an underlined tab strip over the 600px column. -->
			<div
				class="sticky top-0 z-10 hidden border-b border-rule bg-card px-[max(24px,calc((100%-600px)/2))] md:block xl:hidden"
			>
				<FilterTabs items={sectionItems} active={activeId} onselect={go} label={m.nav_settings()} />
			</div>

			<div class="px-4 pb-8 md:mx-auto md:max-w-[648px] md:px-6 xl:max-w-[800px] xl:px-10">
				<section id="products" class={sectionClass} aria-labelledby="settings-products-heading">
					<div class="flex items-start justify-between gap-4">
						{@render heading(
							'settings-products-heading',
							m.settings_products(),
							m.settings_products_hint()
						)}
						<Button
							variant="outline"
							class="h-11 shrink-0 font-semibold desk:h-10"
							onclick={() => (productDialogOpen = true)}
						>
							<Plus />
							<span class="max-md:sr-only">{m.settings_product_add()}</span>
						</Button>
					</div>

					{#if data.products.length === 0}
						<p class="text-ui text-muted-foreground">{m.settings_products_empty()}</p>
					{/if}

					{#each data.products as p (p.id)}
						{@const errs = productErrorsFor(p.id)}
						<form
							method="post"
							action="?/updateProduct"
							use:enhance={productAction.enhance}
							class="flex flex-col gap-[18px] border-t border-rule pt-5 first-of-type:border-t-0 first-of-type:pt-0"
						>
							<input type="hidden" name="productId" value={p.id} />
							<SettingsProductFields idPrefix={`product-${p.id}`} product={p} errors={errs} />

							<div class="flex items-center justify-between gap-4">
								<div>
									<Label for={`product-${p.id}-active`} class="text-sm leading-[18px] font-semibold"
										>{m.settings_product_active()}</Label
									>
									<p class="text-[13px] leading-[18px] text-muted-foreground">
										{m.settings_product_active_hint()}
									</p>
								</div>
								<Switch
									id={`product-${p.id}-active`}
									name="active"
									checked={p.active}
									class="dark:[&>[data-slot=switch-thumb]]:bg-card"
								/>
							</div>
							<FieldError message={errs.active} />

							<div class="flex justify-end">
								<Button type="submit" class={SAVE} disabled={productAction.pending}
									>{m.settings_product_save()}</Button
								>
							</div>
						</form>
					{/each}
				</section>

				<section id="rules" class={sectionClass} aria-labelledby="settings-rules-heading">
					{@render heading('settings-rules-heading', m.settings_rules(), m.settings_rules_hint())}

					<form
						method="post"
						action="?/rules"
						use:enhance={rulesAction.enhance}
						class="flex flex-col gap-[18px]"
					>
						<div class="grid gap-x-4 gap-y-[18px] xl:grid-cols-2">
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
											class="h-11 pr-12 text-base num md:text-[15px] desk:h-11"
											aria-invalid={!!rulesErrors[f.key]}
										/>
										<span
											class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px] text-muted-foreground"
											>{f.unit}</span
										>
									</div>
									<FieldError message={rulesErrors[f.key]} />
								</div>
							{/each}
						</div>

						<div class="flex justify-end">
							<Button type="submit" class={SAVE} disabled={rulesAction.pending}
								>{m.settings_rules_save()}</Button
							>
						</div>
					</form>
				</section>

				<section id="templates" class={sectionClass} aria-labelledby="settings-templates-heading">
					{@render heading(
						'settings-templates-heading',
						m.settings_templates(),
						m.settings_templates_hint()
					)}

					<Tabs.Root bind:value={activeKind} class="gap-4">
						<Tabs.List
							variant="line"
							class="h-auto w-full justify-start gap-[26px] overflow-x-auto border-b border-rule p-0 group-data-horizontal/tabs:h-auto xl:group-data-horizontal/tabs:h-auto"
						>
							{#each FOLLOW_UP_KINDS as kind (kind)}
								<Tabs.Trigger
									value={kind}
									class="h-11 flex-none px-0 text-sm group-data-horizontal/tabs:after:bottom-0 dark:after:bg-accent-foreground data-active:font-bold"
									>{templateTabLabel(kind)}</Tabs.Trigger
								>
							{/each}
						</Tabs.List>

						<!-- Every field stays in the form; inactive ones are hidden, so all five bodies post. -->
						<form
							method="post"
							action="?/templates"
							use:enhance={templatesAction.enhance}
							class="flex flex-col gap-[18px]"
						>
							{#each FOLLOW_UP_KINDS as kind (kind)}
								<div hidden={activeKind !== kind}>
									<SettingsTemplateField
										id={`template-${kind}`}
										name={kind}
										bind:value={templates[kind]}
										error={templateErrors[kind]}
										{sample}
									/>
								</div>
							{/each}

							<div class="flex justify-end">
								<Button type="submit" class={SAVE} disabled={templatesAction.pending}>
									{m.settings_templates_save()}
								</Button>
							</div>
						</form>
					</Tabs.Root>
				</section>

				<section id="data" class={sectionClass} aria-labelledby="settings-data-heading">
					{@render heading('settings-data-heading', m.settings_data(), m.settings_data_hint())}
					<div>
						<Button
							variant="outline"
							href={resolve('/(app)/import')}
							class="h-12 w-full font-semibold md:h-10 md:w-auto desk:h-10"
						>
							<Upload />
							{m.settings_import()}
						</Button>
					</div>
				</section>
			</div>
		</div>
	</div>
</div>

<SettingsProductDialog bind:open={productDialogOpen} errors={createErrors} />
