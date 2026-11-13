<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { FormAction } from '#lib/form-action.svelte.ts';
	import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import ClockIcon from '@lucide/svelte/icons/clock';
	import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
	import MessageCircleIcon from '@lucide/svelte/icons/message-circle';
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import UserPlusIcon from '@lucide/svelte/icons/user-plus';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { diffDays, formatDate, formatDateTime, todayIso } from '#lib/domain/dates.ts';
	import { firstName } from '#lib/format.ts';
	import { fieldError, outcomeLabel } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import type { ActionData, PageData } from './$types';

	let {
		activities,
		maxAttempts,
		form,
		truncated
	}: {
		activities: PageData['activities'];
		maxAttempts: number;
		form: ActionData;
		truncated: boolean;
	} = $props();

	const locale = getLocale() === 'id' ? 'id' : 'en';

	const act = $derived(form && 'action' in form ? form.action : null);
	const formErrors = $derived(
		form && 'errors' in form && form.errors ? (form.errors as Record<string, string>) : {}
	);

	const noteAction = new FormAction(async ({ result, update }) => {
		if (result.type === 'success') toast.success(m.customer_note_saved());
		await update();
	});

	const icons = {
		wa_sent: MessageCircleIcon,
		outcome: CircleCheckIcon,
		order: ShoppingBagIcon,
		note: StickyNoteIcon,
		snooze: ClockIcon,
		scheduled: CalendarPlusIcon,
		customer_created: UserPlusIcon,
		import: FileSpreadsheetIcon
	} as const;

	type Activity = PageData['activities'][number];

	function activityText(a: Activity): string {
		switch (a.type) {
			case 'wa_sent':
				return m.customer_activity_wa_sent();
			case 'outcome':
				return m.customer_activity_outcome({
					outcome: a.outcome ? outcomeLabel(a.outcome) : ''
				});
			case 'order':
				return m.customer_activity_order();
			case 'note':
				return m.customer_activity_note();
			case 'snooze':
				return m.customer_activity_snooze({ date: formatDate(a.body ?? '', locale, 'long') });
			case 'scheduled':
				return m.customer_activity_scheduled();
			case 'customer_created':
				return m.customer_activity_customer_created();
			case 'import':
				return m.customer_activity_import();
		}
	}

	function activityMeta(a: Activity): string {
		if (a.type === 'scheduled') {
			return m.customer_activity_scheduled_sub({
				date: formatDate(a.body ?? '', locale, 'short')
			});
		}
		if (a.type === 'customer_created' || a.type === 'import') return '';
		return [
			a.type === 'outcome' && a.attempt != null
				? m.activity_attempt({ attempt: a.attempt, max: maxAttempts })
				: null,
			a.actorName ? firstName(a.actorName) : null
		]
			.filter(Boolean)
			.join(' · ');
	}

	/** Timestamps within a week show the clock; older ones show only the day. */
	function activityTime(at: Date): string {
		const day = todayIso(at);
		return diffDays(day, todayIso()) <= 7
			? formatDateTime(at, locale)
			: formatDate(day, locale, 'short');
	}
</script>

<h2 class="mb-2 text-ui font-semibold">{m.customer_form_notes()}</h2>
<form method="post" action="?/note" use:enhance={noteAction.enhance} class="space-y-2">
	<Label for="customer-note" class="sr-only">{m.customer_note_placeholder()}</Label>
	<Textarea
		id="customer-note"
		name="body"
		rows={3}
		required
		maxlength={1000}
		placeholder={m.customer_note_placeholder()}
		class="h-16 py-2.5 text-base leading-[18px] desk:text-sm"
	/>
	{#if act === 'note' && formErrors.body}
		<p class="text-sm text-destructive">{fieldError('body', formErrors.body)}</p>
	{/if}
	<div class="flex justify-start">
		<Button
			type="submit"
			variant="outline"
			size="sm"
			class="h-9 px-3.5 text-ui font-semibold desk:h-9"
			disabled={noteAction.pending}
		>
			{m.customer_note_save()}
		</Button>
	</div>
</form>

<h2 class="mt-6 pb-1 text-sm leading-[18px] font-bold">{m.customer_tab_activity()}</h2>
{#if activities.length === 0}
	<p class="pt-4 text-sm text-muted-foreground">{m.customer_no_activity()}</p>
{:else}
	<ol class="divide-y divide-row-rule">
		{#each activities as a (a.id)}
			{@const Icon = icons[a.type]}
			<li class="flex gap-3.5 py-3">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground"
				>
					<Icon class="size-4" aria-hidden="true" />
				</span>
				<div class="min-w-0 flex-1 space-y-0.5">
					<p class="text-sm leading-[18px] font-semibold">{activityText(a)}</p>
					{#if a.body && a.type !== 'snooze' && a.type !== 'scheduled'}
						<p class="line-clamp-3 text-sm break-words whitespace-pre-line text-muted-foreground">
							{a.body}
						</p>
					{/if}
					{#if activityMeta(a)}
						<p class="text-ui leading-4 text-muted-foreground">{activityMeta(a)}</p>
					{/if}
				</div>
				<time class="shrink-0 text-xs text-muted-foreground num">
					{activityTime(a.createdAt)}
				</time>
			</li>
		{/each}
	</ol>
	{#if truncated}
		<p class="mt-3 text-ui leading-[18px] text-muted-foreground">{m.customer_activity_cap()}</p>
	{/if}
{/if}
