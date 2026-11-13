<script lang="ts">
	import type { Snippet } from 'svelte';
	import InitialsAvatar from '#lib/components/initials-avatar.svelte';
	import { cn } from '#lib/utils.js';

	let {
		name,
		label,
		avatarSize = 36,
		avatarMdSize,
		avatarClass,
		nameClass = 'truncate text-[15px] font-semibold leading-[18px] md:text-[14px]',
		href,
		children,
		class: className
	}: {
		name: string;
		/** Text shown instead of the name; the avatar initials still come from `name`. */
		label?: string;
		avatarSize?: 28 | 30 | 36 | 40 | 44 | 48 | 56;
		/** Avatar size from `md` up; defaults to `avatarSize`. */
		avatarMdSize?: 28 | 30 | 36 | 40 | 44 | 48 | 56;
		avatarClass?: string;
		nameClass?: string;
		href?: string;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- callers pass already-resolved hrefs -->

<div class={cn('flex min-w-0 items-center gap-3', className)}>
	<InitialsAvatar {name} size={avatarSize} mdSize={avatarMdSize} class={avatarClass} />
	<div class="flex min-w-0 flex-1 flex-col gap-[3px] md:gap-[2px]">
		{#if href}
			<a {href} class={nameClass}>{label ?? name}</a>
		{:else}
			<p class={nameClass}>{label ?? name}</p>
		{/if}
		{#if children}{@render children()}{/if}
	</div>
</div>
