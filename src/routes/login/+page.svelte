<script lang="ts">
	import { page } from '$app/state';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import { localeName } from '#lib/components/app-shell/preference-items.svelte';
	import GoogleButton from '#lib/components/google-button.svelte';
	import { m } from '#lib/paraglide/messages.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
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
</script>

<!-- Returning with the Back button restores this page from cache; let the user try again. -->
<svelte:window onpageshow={() => (signingIn = false)} />

<main
	class="flex min-h-dvh flex-col items-center justify-center gap-7 bg-sidebar px-6 py-10 md:gap-9"
>
	<div
		class="grid size-14 place-items-center rounded-[12px] bg-sidebar-primary text-[28px] leading-[34px] font-bold text-sidebar-primary-foreground md:size-16 md:text-[32px] md:leading-10 xl:size-[72px] xl:text-4xl xl:leading-[44px]"
		aria-hidden="true"
	>
		{m.app_name().slice(0, 1)}
	</div>

	<div class="flex flex-col items-center gap-3">
		<h1
			class="text-center text-[50px] leading-[48px] font-bold tracking-[-1.7px] text-sidebar-foreground md:text-[80px] md:leading-[76px] md:tracking-[-2.7px] xl:text-[104px] xl:leading-[99px] xl:tracking-[-3.5px]"
		>
			{m.app_name()}
		</h1>
		<p class="text-center text-base leading-[26px] text-sidebar-muted md:text-lg">
			{m.login_subtitle()}
		</p>
	</div>

	{#if error}
		<div
			role="alert"
			class="flex w-full max-w-full items-start gap-2.5 rounded-[6px] border border-alert-border bg-alert px-4 py-3 md:w-[420px] xl:w-[380px]"
		>
			<span class="pt-0.5"
				><CircleAlert class="size-4 text-status-overdue" aria-hidden="true" /></span
			>
			<p class="text-sm leading-5 text-alert-foreground">{error}</p>
		</div>
	{/if}

	<form method="post" action="?/google" onsubmit={() => (signingIn = true)} class="contents">
		<GoogleButton disabled={signingIn} label={m.login_google()} />
	</form>

	<p
		class="max-w-[382px] text-center text-sm leading-5 text-sidebar-muted md:max-w-[460px] xl:max-w-[420px]"
	>
		{m.login_footnote()}
	</p>

	<div class="mt-2 flex items-center gap-2 text-sm leading-[18px] text-sidebar-muted">
		<span>{m.language()}</span>
		{#each locales as locale (locale)}
			<button
				type="button"
				aria-current={getLocale() === locale ? 'true' : undefined}
				onclick={() => setLocale(locale)}
				class="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring aria-[current=true]:font-bold aria-[current=true]:text-sidebar-foreground"
				>{localeName(locale)}</button
			>
		{/each}
	</div>
</main>
