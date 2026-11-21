<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { userPrefersMode } from 'mode-watcher';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import {
		applyTheme,
		localeName,
		themes
	} from '#lib/components/app-shell/preference-items.svelte';
	import { moreItems } from '#lib/components/app-shell/nav-items.js';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import MessageCircle from '@lucide/svelte/icons/message-circle';
	import Moon from '@lucide/svelte/icons/moon';
	import PageHeader from '#lib/components/page-header.svelte';
	import { firstName } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';

	const user = $derived((page.data as { user: { name: string; email: string } }).user);

	const row = 'flex items-center gap-3.5 border-b border-row-rule px-4';
	const trackClass = 'flex rounded-[8px] bg-secondary p-[3px]';
	const optionClass = (on: boolean) =>
		cn(
			'flex h-[34px] flex-1 items-center justify-center rounded-[5px] text-ui outline-none has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring',
			on
				? 'bg-card font-semibold shadow-[0_1px_2px_color-mix(in_oklch,var(--foreground)_12%,transparent)]'
				: 'font-normal text-muted-foreground'
		);
</script>

{#snippet band()}
	<div class="h-2 border-y border-rule bg-background" aria-hidden="true"></div>
{/snippet}

<div class="min-h-dvh bg-card">
	<PageHeader title={m.nav_more()} />
	<!-- Groups split by 8px grey bands: profile, links, preferences, sign-out. -->
	<div
		class="md:mx-7 md:mt-6 md:max-w-xl md:overflow-hidden md:rounded-xl md:border md:border-border"
	>
		<div class="flex items-center gap-3.5 px-4 py-4">
			<InitialsAvatar name={user.name} size={44} class="text-base font-bold" />
			<div class="min-w-0">
				<p class="truncate text-[17px] leading-[22px] font-semibold">{firstName(user.name)}</p>
				<p class="truncate text-[13.5px] leading-[18px] text-muted-foreground">{user.email}</p>
			</div>
		</div>

		{@render band()}
		{#each moreItems as item (item.href)}
			<a
				href={resolve(item.route)}
				class={cn(
					row,
					'h-14 text-[15px] outline-none last-of-type:border-b-0 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
				)}
			>
				<item.icon class="size-5 text-muted-foreground" aria-hidden="true" />
				<span class="flex-1 leading-[18px]"
					>{item.href === '/import' ? m.import_title() : item.label()}</span
				>
				<ChevronRight class="size-4 opacity-70" aria-hidden="true" />
			</a>
		{/each}

		{@render band()}
		<div role="radiogroup" aria-label={m.nav_theme()} class={cn(row, 'h-14')}>
			<Moon class="size-5 text-muted-foreground" aria-hidden="true" />
			<span class="flex-1 text-[15px] leading-[18px]">{m.nav_theme()}</span>
			<div class={cn(trackClass, 'w-[206px]')}>
				{#each themes as t (t.value)}
					<label class={optionClass(userPrefersMode.current === t.value)}>
						<input
							type="radio"
							name="theme"
							value={t.value}
							class="sr-only"
							checked={userPrefersMode.current === t.value}
							onchange={() => applyTheme(t.value)}
						/>
						{t.label()}
					</label>
				{/each}
			</div>
		</div>

		<div role="radiogroup" aria-label={m.language()} class={cn(row, 'h-14 border-b-0')}>
			<MessageCircle class="size-5 text-muted-foreground" aria-hidden="true" />
			<span class="flex-1 text-[15px] leading-[18px]">{m.language()}</span>
			<div class={cn(trackClass, 'w-[206px]')}>
				{#each locales as locale (locale)}
					<label class={optionClass(getLocale() === locale)}>
						<input
							type="radio"
							name="locale"
							value={locale}
							class="sr-only"
							checked={getLocale() === locale}
							onchange={() => setLocale(locale as never)}
						/>
						{localeName(locale)}
					</label>
				{/each}
			</div>
		</div>

		{@render band()}
		<form method="post" action="/logout" class="p-4">
			<button
				type="submit"
				class="h-11 w-full rounded-lg border border-alert-border bg-card text-[15px] font-semibold text-status-overdue outline-none hover:bg-alert focus-visible:ring-3 focus-visible:ring-ring"
			>
				{m.sign_out()}
			</button>
		</form>
	</div>
</div>
