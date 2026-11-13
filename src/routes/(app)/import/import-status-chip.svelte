<script lang="ts">
	import { chipClass, statusLabel, type RowStatus } from './import-model.ts';

	let { status }: { status: RowStatus } = $props();
</script>

<span class="shrink-0 text-xs font-semibold whitespace-nowrap md:text-ui {chipClass[status]}">
	{statusLabel(status)}
</span>
