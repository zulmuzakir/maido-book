<script lang="ts">
	import './layout.css';
	import { ModeWatcher } from 'mode-watcher';
	import { setLucideProps } from '@lucide/svelte/context';
	import favicon from '#lib/assets/favicon.svg';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// ROOVE icons are drawn at 1.7 (buttons raise it to 1.9 in button.svelte).
	setLucideProps({ strokeWidth: 1.7 });

	// ROOVE toasts: an ink pill for normal and success, light red for errors. Each type carries its
	// own colours so that no class competes with another on the same element.
	const pill =
		'!h-12 !w-max !max-w-[min(520px,calc(100vw-32px))] !items-center !gap-3.5 !pl-4 !pr-2 !py-0 !rounded-[10px] !border-transparent !bg-foreground !text-[14px] !leading-[18px] !text-background !shadow-[0_12px_32px_color-mix(in_oklch,var(--shadow-tint)_30%,transparent)]';
	const toastClasses = {
		default: pill,
		normal: pill,
		success: pill,
		info: pill,
		warning: pill,
		loading: pill,
		action: pill,
		error:
			'!w-[376px] !items-start !gap-4 !rounded-[6px] !border-alert-border !bg-alert !px-4 !py-[14px] !text-[14px] !leading-5 !text-alert-foreground !shadow-[0_8px_24px_color-mix(in_oklch,var(--shadow-tint)_14%,transparent)] [&_[data-icon]]:!hidden [&_[data-title]]:!leading-5',
		title: '!font-normal !leading-[18px]',
		actionButton:
			'!h-auto !ml-auto !px-3 !py-2 !rounded-[6px] !bg-background/20 !text-[14px] !leading-[18px] !font-semibold !text-background'
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.app_name()}</title>
</svelte:head>

<!-- Synchronous, so a theme switch can be snapshotted by a View Transition (see applyTheme). -->
<ModeWatcher synchronousModeChanges />
<!-- Bottom centre of the content area: shifted by half the rail/sidebar from md up, and
     above the 72px bottom nav on phones. -->
<Toaster
	position="bottom-center"
	offset={{ bottom: '24px' }}
	mobileOffset={{ bottom: 'calc(72px + env(safe-area-inset-bottom) + 12px)' }}
	class="md:!left-[calc(50%+42px)] xl:!left-[calc(50%+116px)]"
	toastOptions={{ classes: toastClasses }}
/>

{@render children()}
