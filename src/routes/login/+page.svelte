<script lang="ts">
	import { page } from '$app/state';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import { localeName } from '#lib/components/app-shell/preference-items.svelte';
	import GoogleButton from '#lib/components/google-button.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
	import { cn } from '#lib/utils.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	// The action redirects to Google; block a second submit while that page loads.
	let signingIn = $state(false);

	const error = $derived(
		page.url.searchParams.get('error') === 'not_allowed'
			? m.login_not_allowed()
			: page.url.searchParams.has('error') || form?.failed
				? m.login_failed()
				: null
	);

	// The brand gradient behind the hero (desktop), the whole page (tablet) and the top half (phone).
	const HERO =
		'bg-[linear-gradient(170deg,#592C82,#3F1F5E)] text-white dark:bg-[linear-gradient(170deg,#6E3E9A,#3F1F5E)]';
</script>

<!-- Returning with the Back button restores this page from cache; let the user try again. -->
<svelte:window onpageshow={() => (signingIn = false)} />

{#snippet logo(size: string)}
	<span
		class={cn(
			'grid shrink-0 place-items-center rounded-[10px] bg-accent font-extrabold text-accent-foreground',
			size
		)}
		aria-hidden="true">{m.app_name().slice(0, 1)}</span
	>
{/snippet}

<!-- On the gradient: a translucent track with a white pill. On the surface (phone): a grey track. -->
{#snippet language(onHero: boolean, cls = '')}
	<div class={cn('flex items-center gap-3', cls)}>
		<span
			class={cn('text-[13px] font-semibold', onHero ? 'text-white/80' : 'text-muted-foreground')}
			>{m.language()}</span
		>
		<div
			class={cn('flex h-[42px] rounded-[10px] p-[3px]', onHero ? 'bg-white/15' : 'bg-secondary')}
			role="group"
			aria-label={m.language()}
		>
			{#each locales as locale (locale)}
				<button
					type="button"
					aria-pressed={getLocale() === locale}
					onclick={() => setLocale(locale)}
					class={cn(
						'rounded-[8px] px-3.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
						getLocale() === locale
							? 'bg-card font-bold text-foreground shadow-sm'
							: onHero
								? 'font-medium text-white/85 hover:text-white'
								: 'font-medium text-muted-foreground hover:text-foreground'
					)}>{localeName(locale)}</button
				>
			{/each}
		</div>
	</div>
{/snippet}

{#snippet signIn()}
	<div class="flex flex-col gap-5">
		<div>
			<h1 class="text-[26px] leading-8 font-bold tracking-[-0.02em]">{m.login_title()}</h1>
			<p class="mt-1 text-[15px] leading-[22px] text-muted-foreground">{m.login_subtitle()}</p>
		</div>
		{#if error}
			<div role="alert" class="flex items-start gap-2.5 rounded-lg bg-alert px-4 py-3">
				<TriangleAlert class="mt-0.5 size-4 shrink-0 text-status-overdue" aria-hidden="true" />
				<p class="text-sm leading-5 text-alert-foreground">{error}</p>
			</div>
		{/if}
		<form method="post" action="?/google" onsubmit={() => (signingIn = true)}>
			<GoogleButton disabled={signingIn} label={m.login_google()} />
		</form>
		<p class="text-[13px] leading-[19px] text-muted-foreground">{m.login_footnote()}</p>
	</div>
{/snippet}

<main class="min-h-dvh bg-card text-foreground">
	<!-- Desktop: gradient hero on the left, a 560px sign-in panel on the right. -->
	<div class="hidden min-h-dvh xl:grid xl:grid-cols-[minmax(0,1fr)_560px]">
		<section class={cn('flex flex-col justify-between p-14', HERO)}>
			<div class="flex items-center gap-3">
				{@render logo('size-10 text-lg')}
				<span class="text-xl font-bold tracking-[-0.02em]">{m.app_name()}</span>
			</div>
			<div class="max-w-[560px]">
				<p class="text-[44px] leading-[52px] font-bold tracking-[-0.03em]">
					{m.login_hero_title()}
				</p>
				<p class="mt-4 text-base leading-6 text-white/80">{m.login_hero_sub()}</p>
			</div>
			{@render language(true)}
		</section>
		<section class="flex items-center justify-center px-10">
			<div class="w-full max-w-[380px]">{@render signIn()}</div>
		</section>
	</div>

	<!-- Tablet: a card centred on the gradient. -->
	<div
		class={cn(
			'hidden min-h-dvh flex-col items-center justify-center gap-7 px-6 py-10 md:flex xl:hidden',
			HERO
		)}
	>
		<div class="flex items-center gap-3">
			{@render logo('size-12 text-2xl')}
			<span class="text-[28px] font-bold tracking-[-0.02em]">{m.app_name()}</span>
		</div>
		<div
			class="w-full max-w-[460px] rounded-[12px] bg-card p-9 text-foreground shadow-[0_20px_50px_rgb(0_0_0/0.25)]"
		>
			{@render signIn()}
		</div>
		{@render language(true)}
	</div>

	<!-- Phone: the gradient fills the top, the sign-in sheet sits under it. -->
	<div class="flex min-h-dvh flex-col md:hidden">
		<section class={cn('flex flex-1 flex-col justify-end gap-3 px-6 pt-16 pb-12', HERO)}>
			{@render logo('size-[52px] text-2xl')}
			<p class="mt-3 text-[30px] leading-9 font-bold tracking-[-0.02em]">{m.app_name()}</p>
			<p class="text-[15px] leading-[22px] text-white/80">{m.login_tagline()}</p>
		</section>
		<section
			class="-mt-4 flex flex-col gap-5 rounded-t-[16px] bg-card px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
		>
			{@render signIn()}
			{@render language(false, 'justify-center')}
		</section>
	</div>
</main>
