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
	import * as ToggleGroup from '#lib/components/ui/toggle-group/index.js';
	import { firstName } from '#lib/format.ts';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
	import { segment } from '#lib/styles.ts';
	import { cn } from '#lib/utils.js';

	const user = $derived((page.data as { user: { name: string; email: string } }).user);

	const row = 'flex items-center gap-3.5 border-b border-row-rule px-4';
	const trackClass = 'flex rounded-[8px] bg-secondary p-[3px]';
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
		<div class={cn(row, 'h-14')}>
			<Moon class="size-5 text-muted-foreground" aria-hidden="true" />
			<span id="more-theme-label" class="flex-1 text-[15px] leading-[18px]">{m.nav_theme()}</span>
			<ToggleGroup.Root
				type="single"
				size="sm"
				spacing={0.5}
				aria-labelledby="more-theme-label"
				class={cn(trackClass, 'w-[206px]')}
				bind:value={() => userPrefersMode.current, (v) => v && applyTheme(v)}
			>
				{#each themes as t (t.value)}
					<ToggleGroup.Item value={t.value} class={segment}>{t.label()}</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>

		<div class={cn(row, 'h-14 border-b-0')}>
			<MessageCircle class="size-5 text-muted-foreground" aria-hidden="true" />
			<span id="more-language-label" class="flex-1 text-[15px] leading-[18px]">{m.language()}</span>
			<ToggleGroup.Root
				type="single"
				size="sm"
				spacing={0.5}
				aria-labelledby="more-language-label"
				class={cn(trackClass, 'w-[206px]')}
				bind:value={() => getLocale(), (v) => v && setLocale(v as never)}
			>
				{#each locales as locale (locale)}
					<ToggleGroup.Item value={locale} class={segment}>{localeName(locale)}</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</div>

		{@render band()}
		<form method="post" action={resolve('/logout')} class="p-4">
			<button
				type="submit"
				class="h-11 w-full rounded-lg border border-alert-border bg-card text-[15px] font-semibold text-status-overdue outline-none hover:bg-alert focus-visible:ring-3 focus-visible:ring-ring"
			>
				{m.sign_out()}
			</button>
		</form>
	</div>
</div>
