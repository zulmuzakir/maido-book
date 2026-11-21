<script lang="ts">
	import { navigating } from '$app/state';
	import { DURATION, EASE, motionMs } from '#lib/motion.ts';
	import { Tween } from 'svelte/motion';
	import { fade } from 'svelte/transition';

	// A navigation waits on its page's D1 reads. Most land in well under 150ms and show nothing;
	// a slower one gets a thin bar that creeps towards the end, then fills and fades when it lands.
	const DELAY = 150;

	let visible = $state(false);
	const progress = new Tween(0, { easing: EASE });
	let run = 0;

	$effect(() => {
		if (!navigating.to) return;
		const id = ++run;
		let shown = false;
		const timer = setTimeout(() => {
			shown = true;
			visible = true;
			void progress.set(0, { duration: 0 });
			void progress.set(0.85, { duration: motionMs(4000) });
		}, DELAY);
		return () => {
			clearTimeout(timer);
			if (!shown) return;
			void progress.set(1, { duration: motionMs(DURATION.fast) }).then(() => {
				if (id === run) visible = false;
			});
		};
	});
</script>

{#if visible}
	<div
		class="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
		aria-hidden="true"
		out:fade={{ duration: motionMs(DURATION.fast) }}
	>
		<div class="h-full origin-left bg-primary" style:transform="scaleX({progress.current})"></div>
	</div>
{/if}
