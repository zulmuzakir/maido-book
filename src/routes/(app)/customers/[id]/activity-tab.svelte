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
	import FieldError from '#lib/components/field-error.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import BusyLabel from '#lib/components/busy-label.svelte';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { formatDate, todayIso } from '#lib/domain/dates.ts';
	import { firstName, formatRupiah } from '#lib/format.ts';
	import { fieldError, outcomeLabel } from '#lib/labels.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { slide } from 'svelte/transition';
	import { getLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { ActionData, PageData } from './$types';

	let {
		activities,
		maxAttempts,
		form,
		truncated,
		today,
		class: className
	}: {
		activities: PageData['activities'];
		maxAttempts: number;
		form: ActionData;
		truncated: boolean;
		/** Jakarta date from the server, so "today" matches the rest of the page. */
		today: string;
		class?: string;
	} = $props();

	const locale = $derived(getLocale() === 'id' ? 'id' : 'en');

	const act = $derived(form && 'action' in form ? form.action : null);
	const formErrors = $derived(
		form && 'errors' in form && form.errors ? (form.errors as Record<string, string>) : {}
	);

	const noteError = $derived(
		act === 'note' && formErrors.body ? fieldError('body', formErrors.body) : null
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
				return m.customer_activity_customer_created();
		}
	}

	/** The quiet line under the title: what was ordered, when it was scheduled, who did it. */
	function activityMeta(a: Activity): string {
		if (a.type === 'scheduled') {
			return m.customer_activity_scheduled_sub({
				date: formatDate(a.body ?? '', locale, 'short')
			});
		}
		if (a.type === 'import') return m.customer_activity_import();
		if (a.type === 'customer_created') return '';
		if (a.type === 'order') {
			if (a.orderQty == null) return '';
			const what = m
				.order_items({ qty: a.orderQty, unit: a.orderUnit ?? '', product: a.orderProduct ?? '' })
				.replace(/\s+/g, ' ')
				.trim();
			return a.orderTotal != null ? `${what} · ${formatRupiah(a.orderTotal)}` : what;
		}
		return [
			a.type === 'outcome' && a.attempt != null
				? m.activity_attempt({ attempt: a.attempt, max: maxAttempts })
				: null,
			a.actorName ? firstName(a.actorName) : null
		]
			.filter(Boolean)
			.join(' · ');
	}

	const thisYear = $derived(today.slice(0, 4));
	const timeFmt = $derived.by(
		() =>
			new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: false,
				timeZone: 'Asia/Jakarta'
			})
	);

	/** Newest first, one group per Jakarta day. */
	const days = $derived.by(() => {
		const out: { day: string; items: Activity[] }[] = [];
		for (const a of activities) {
			const day = todayIso(a.createdAt);
			const last = out.at(-1);
			if (last && last.day === day) last.items.push(a);
			else out.push({ day, items: [a] });
		}
		return out;
	});
	const dayLabel = (day: string) =>
		formatDate(day, locale, day.startsWith(thisYear) ? 'short' : 'medium');
</script>

<!-- Note composer, then the history grouped by day. Only today's rows show a clock time; older
     rows are dated by their day heading. -->
<div class={cn('flex flex-col gap-2', className)}>
	<form method="post" action="?/note" use:enhance={noteAction.enhance} class="flex flex-col gap-2">
		<Label for="customer-note" class="sr-only">{m.customer_form_notes()}</Label>
		<Textarea
			id="customer-note"
			name="body"
			rows={3}
			required
			maxlength={1000}
			placeholder={m.customer_note_placeholder()}
			aria-invalid={noteError ? 'true' : undefined}
			aria-describedby={noteError ? 'customer-note-error' : undefined}
			class="h-20 resize-none px-3 py-2.5 text-base leading-5 desk:text-[15px]"
		/>
		<FieldError id="customer-note-error" message={noteError} />
		<div class="flex justify-end">
			<Button
				type="submit"
				variant="outline"
				class="font-semibold"
				disabled={noteAction.pending}
				aria-busy={noteAction.pending}
			>
				<BusyLabel busy={noteAction.pending}>{m.customer_note_save()}</BusyLabel>
			</Button>
		</div>
	</form>

	<section aria-labelledby="customer-activity-title">
		<h2 id="customer-activity-title" class="sr-only">{m.customer_tab_activity()}</h2>
		{#if activities.length === 0}
			<p class="pt-4 text-sm text-muted-foreground">{m.customer_no_activity()}</p>
		{:else}
			<!-- A new note (or a send, an order) slides into the list; the list it opens with does not. -->
			{#each days as group (group.day)}
				<div in:slide={{ duration: motionMs(DURATION.base), easing: EASE }}>
					<h3 class="pt-3.5 pb-1.5 text-[13px] leading-4 font-bold text-avatar-foreground num">
						{dayLabel(group.day)}
					</h3>
					<ol>
						{#each group.items as a (a.id)}
							{@const Icon = icons[a.type]}
							{@const meta = activityMeta(a)}
							<li
								class="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-x-3 border-b border-rule py-2.5"
								in:slide={{ duration: motionMs(DURATION.base), easing: EASE }}
							>
								<span
									class="flex size-9 items-center justify-center rounded-full bg-avatar text-primary-text"
								>
									<Icon class="size-[17px]" aria-hidden="true" />
								</span>
								<div class="flex min-h-9 min-w-0 flex-col justify-center">
									<p class="text-[14.5px] leading-5 font-semibold">{activityText(a)}</p>
									{#if a.body && a.type !== 'snooze' && a.type !== 'scheduled'}
										<p
											class="mt-0.5 line-clamp-3 text-sm break-words whitespace-pre-line text-muted-foreground"
										>
											{a.body}
										</p>
									{/if}
									{#if meta}
										<p class="mt-0.5 text-[13px] leading-[18px] text-muted-foreground">{meta}</p>
									{/if}
								</div>
								{#if group.day === today}
									<time
										datetime={a.createdAt.toISOString()}
										class="pt-2 text-[13px] text-muted-foreground num"
									>
										{timeFmt.format(a.createdAt)}
									</time>
								{:else}
									<span></span>
								{/if}
							</li>
						{/each}
					</ol>
				</div>
			{/each}
			{#if truncated}
				<p class="mt-3 text-ui leading-[18px] text-muted-foreground">
					{m.customer_activity_cap()}
				</p>
			{/if}
		{/if}
	</section>
</div>
