<script lang="ts" module>
	import { flushSync } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { resetMode, setMode } from 'mode-watcher';
	import { m } from '#lib/paraglide/messages.js';

	export const themes = [
		{ value: 'light', label: () => m.theme_light() },
		{ value: 'dark', label: () => m.theme_dark() },
		{ value: 'system', label: () => m.theme_system() }
	] as const;

	function setTheme(v: string) {
		if (v === 'system') resetMode();
		else setMode(v as 'light' | 'dark');
	}

	/**
	 * Switches the theme with a short cross-fade (a View Transition) instead of every colour
	 * changing in one frame. The snapshot needs the new `.dark` class in place before the callback
	 * returns: `<ModeWatcher synchronousModeChanges>` applies it without waiting a frame, and
	 * `flushSync()` runs the effect that applies it. Without the API, or with reduced motion, the
	 * theme just switches.
	 */
	export function applyTheme(v: string) {
		if (!document.startViewTransition || prefersReducedMotion.current) {
			setTheme(v);
			return;
		}
		document.startViewTransition(() => {
			setTheme(v);
			flushSync();
		});
	}

	export const localeName = (l: string) =>
		l === 'id' ? m.locale_name_id() : l === 'en' ? m.locale_name_en() : l;
</script>

<script lang="ts">
	import { userPrefersMode } from 'mode-watcher';
	import * as DropdownMenu from '#lib/components/ui/dropdown-menu/index.js';
	import { getLocale, locales, setLocale } from '#lib/paraglide/runtime.js';
</script>

<DropdownMenu.Group>
	<DropdownMenu.GroupHeading>{m.nav_theme()}</DropdownMenu.GroupHeading>
	<DropdownMenu.RadioGroup value={userPrefersMode.current} onValueChange={applyTheme}>
		{#each themes as t (t.value)}
			<DropdownMenu.RadioItem value={t.value}>{t.label()}</DropdownMenu.RadioItem>
		{/each}
	</DropdownMenu.RadioGroup>
</DropdownMenu.Group>
<DropdownMenu.Separator />
<DropdownMenu.Group>
	<DropdownMenu.GroupHeading>{m.language()}</DropdownMenu.GroupHeading>
	<DropdownMenu.RadioGroup value={getLocale()} onValueChange={(v) => setLocale(v as never)}>
		{#each locales as locale (locale)}
			<DropdownMenu.RadioItem value={locale}>{localeName(locale)}</DropdownMenu.RadioItem>
		{/each}
	</DropdownMenu.RadioGroup>
</DropdownMenu.Group>
