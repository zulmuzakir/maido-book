<script lang="ts">
	import type { LucideIcon } from '@lucide/svelte';
	import { m } from '#lib/paraglide/messages.js';

	let {
		sections,
		active,
		ongo
	}: {
		sections: { id: string; label: () => string; icon: LucideIcon }[];
		active: string;
		ongo: (id: string) => void;
	} = $props();
</script>

<nav
	aria-label={m.nav_settings()}
	class="sticky top-0 hidden min-h-[calc(100dvh-68px)] self-start border-r border-rule px-3 py-5 xl:block"
>
	<ul class="flex flex-col gap-0.5">
		{#each sections as s (s.id)}
			{@const Icon = s.icon}
			<li>
				<button
					type="button"
					aria-current={active === s.id ? 'true' : undefined}
					class={[
						'flex h-[42px] w-full items-center gap-2.5 rounded-lg px-3 text-sm leading-[18px] transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring',
						active === s.id
							? 'bg-accent font-semibold text-accent-foreground'
							: 'font-medium text-muted-foreground hover:bg-muted'
					]}
					onclick={() => ongo(s.id)}
				>
					<Icon class={['size-[17px] shrink-0', active === s.id && 'text-primary-text']} />
					{s.label()}
				</button>
			</li>
		{/each}
	</ul>
</nav>
