<script lang="ts">
	let { class: className }: { class?: string } = $props();
</script>

<svg
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="1.8"
	stroke-linecap="round"
	stroke-linejoin="round"
	class={className}
	aria-hidden="true"
>
	<path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z" />
	<path d="M9 8.5c0 3.5 2.6 6.4 6.3 6.6l1-1.4-2-1-1 .8c-1.2-.5-2.2-1.5-2.8-2.8l.8-1-1-2-1.4 1z" />
</svg>
