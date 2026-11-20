<script lang="ts">
	import './layout.css';
	import { MediaQuery } from 'svelte/reactivity';
	import { ModeWatcher } from 'mode-watcher';
	import favicon from '#lib/assets/favicon.svg';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import { m } from '#lib/paraglide/messages.js';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const wide = new MediaQuery('(min-width: 768px)');

	// Paper toasts: a dark pill for normal and success, light red for errors. Each type carries its
	// own colours so that no class competes with another on the same element.
	const pill =
		'!h-[52px] !w-max !max-w-[min(520px,calc(100vw-48px))] !items-center !gap-4 !px-[18px] !py-0 !rounded-[8px] !border-transparent !bg-foreground !text-[14px] !leading-[18px] !text-card !shadow-[0_12px_32px_color-mix(in_oklch,var(--shadow-tint)_30%,transparent)] dark:!text-background';
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
			'!h-auto !p-0 !bg-transparent !text-[14px] !leading-[18px] !font-bold !text-toast-action'
	};
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{m.app_name()}</title>
</svelte:head>

<ModeWatcher />
<Toaster
	position={wide.current ? 'top-right' : 'top-center'}
	offset={{ top: '16px', right: '24px', bottom: '24px', left: '24px' }}
	mobileOffset={{ top: '16px', right: '16px', bottom: 'calc(4.75rem + 16px)', left: '16px' }}
	toastOptions={{ classes: toastClasses }}
/>

{@render children()}
