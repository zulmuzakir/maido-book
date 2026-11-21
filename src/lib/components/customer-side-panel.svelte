<script lang="ts">
	import { resolve } from '$app/paths';
	import UsersIcon from '@lucide/svelte/icons/users';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import { formatDate } from '#lib/domain/dates.ts';
	import { supplyStatus } from '#lib/domain/follow-up.ts';
	import { formatPhone, normalizePhone } from '#lib/domain/phone.ts';
	import { relativeDue } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { CustomerSnapshot } from '#lib/domain/types.ts';
	import { cn } from '#lib/utils.js';

	type Props = { today: string; class?: string } & (
		| {
				/** Pelanggan baru: a live card of what is being typed, and what happens on save. */
				kind: 'preview';
				name: string;
				phone: string;
				dose: number | null;
		  }
		| {
				/** The number belongs to this customer already. */
				kind: 'duplicate';
				customer: CustomerSnapshot;
		  }
		| {
				/** Ubah pelanggan: who this is and where they stand. */
				kind: 'summary';
				customer: CustomerSnapshot;
		  }
	);

	let props: Props = $props();

	const locale = $derived(getLocale());
	const heading = $derived(
		props.kind === 'preview'
			? m.customer_panel_preview()
			: props.kind === 'duplicate'
				? m.customer_panel_duplicate()
				: m.customer_panel_summary()
	);
	const doseText = (n: number) => m.customer_panel_dose({ count: n });

	const previewPhone = $derived.by(() => {
		if (props.kind !== 'preview') return '';
		const p = normalizePhone(props.phone);
		const typed = props.phone.trim();
		return p ? formatPhone(p) : typed ? `+62 ${typed}` : '+62 —';
	});

	type Row = { label: string; value: string; tone?: string };
	const rows = $derived.by((): Row[] => {
		if (props.kind === 'preview') return [];
		const c = props.customer;
		const o = c.lastOrder;
		const lastOrder = o
			? m.customers_row_order({
					qty: o.qty,
					unit: o.unitLabel,
					date: formatDate(o.orderDate, locale, 'short')
				})
			: '—';
		if (props.kind === 'duplicate') {
			const left = o ? supplyStatus({ ...o, today: props.today }).daysLeft : null;
			return [
				{ label: m.customers_col_last_order(), value: lastOrder },
				{ label: m.customer_panel_dose_label(), value: doseText(c.dosePerDay) },
				{
					label: m.customer_supply_title(),
					value:
						left === null
							? '—'
							: left < 0
								? m.stock_out_ago({ count: -left })
								: left === 0
									? m.stock_out_today()
									: m.stock_days_left({ count: left }),
					tone: left !== null && left <= 0 ? 'text-status-overdue' : ''
				}
			];
		}
		const fu = c.followUp;
		return [
			{
				label: m.customer_panel_since(),
				value: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
					month: 'short',
					year: 'numeric',
					timeZone: 'UTC'
				}).format(new Date(`${c.since}T00:00:00Z`))
			},
			{
				label: m.customer_panel_orders(),
				value: m.customer_panel_order_count({
					count: c.orderCountCapped ? `${c.orderCount}+` : String(c.orderCount)
				})
			},
			{ label: m.customers_col_last_order(), value: lastOrder },
			{
				label: m.customer_panel_follow_up(),
				value: fu ? relativeDue(fu.dueDate, props.today) : '—',
				tone: fu && !fu.contacted && fu.dueDate < props.today ? 'text-status-overdue' : ''
			}
		];
	});
</script>

<!-- Desktop only: a 360px panel beside the 560px form. -->
<aside class={cn('flex flex-col gap-3.5 self-start rounded-[12px] bg-inset p-5', props.class)}>
	<h2 class="text-ui font-semibold text-muted-foreground">{heading}</h2>

	<div class="flex items-center gap-3 rounded-[10px] border border-rule bg-card p-3">
		{#if props.kind === 'preview'}
			{#if props.name.trim()}
				<InitialsAvatar name={props.name} size={40} class="font-extrabold" />
			{:else}
				<span
					class="grid size-10 shrink-0 place-items-center rounded-full border-[1.5px] border-dashed border-border text-muted-foreground"
					aria-hidden="true"
				>
					<UsersIcon class="size-[18px]" />
				</span>
			{/if}
			<div class="min-w-0 flex-1">
				<p
					class={cn(
						'truncate text-[15px] font-semibold',
						!props.name.trim() && 'text-muted-foreground'
					)}
				>
					{props.name.trim() || m.customer_form_name_placeholder()}
				</p>
				<p class="mt-0.5 text-[13px] text-muted-foreground num">
					{previewPhone}&nbsp;· {props.dose ? doseText(props.dose) : '—'}
				</p>
			</div>
		{:else}
			<InitialsAvatar name={props.customer.name} size={40} class="font-extrabold" />
			<div class="min-w-0 flex-1">
				<p class="truncate text-[15px] font-semibold">{props.customer.name}</p>
				<p class="mt-0.5 text-[13px] text-muted-foreground num">
					{formatPhone(props.customer.phone)}
				</p>
			</div>
		{/if}
	</div>

	{#if props.kind === 'preview'}
		<div class="h-px bg-rule" aria-hidden="true"></div>
		<h3 class="text-[13px] font-semibold">{m.customer_panel_after_save()}</h3>
		<ol class="flex flex-col gap-2.5">
			{#each [m.customer_panel_step_list(), m.customer_panel_step_order(), m.customer_panel_step_follow_up()] as step, i (step)}
				<li class="flex items-start gap-2.5 text-sm leading-5">
					<span
						class={cn(
							'grid size-[22px] shrink-0 place-items-center rounded-full text-xs font-bold num',
							i === 0
								? 'bg-primary text-primary-foreground'
								: 'border border-border bg-card text-avatar-foreground'
						)}
						aria-hidden="true">{i + 1}</span
					>
					{step}
				</li>
			{/each}
		</ol>
	{:else}
		<dl class="flex flex-col">
			{#each rows as row, i (row.label)}
				<div
					class={cn('flex justify-between gap-3 py-[9px] text-sm', i > 0 && 'border-t border-rule')}
				>
					<dt class="text-muted-foreground">{row.label}</dt>
					<dd class={cn('text-right font-semibold num first-letter:uppercase', row.tone)}>
						{row.value}
					</dd>
				</div>
			{/each}
		</dl>
		{#if props.kind === 'duplicate'}
			<Button
				variant="outline"
				href={resolve('/(app)/customers/[id]', { id: props.customer.id })}
				class="w-full font-semibold desk:h-10"
			>
				{m.customer_duplicate_open()}
			</Button>
		{/if}
		<p class="text-[13px] leading-[19px] text-muted-foreground">
			{props.kind === 'duplicate'
				? m.customer_panel_duplicate_note()
				: m.customer_panel_summary_note()}
		</p>
	{/if}
</aside>
