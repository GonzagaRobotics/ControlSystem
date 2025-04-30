<script lang="ts">
	import type { Core } from '$lib/core/core.svelte';
	import { getContext, onMount } from 'svelte';

	let { id, start, size, loading = false, containerClasses = '', children = undefined } = $props();

	const core = getContext<Core>('core');

	let _name = $derived(core.config.panes.find((pane) => pane.id === id)?.name ?? 'Unknown');
	let _grid_col_classes = $derived(`${start.x + 1} / ${start.x + size.x + 1}`);
	let _grid_row_classes = $derived(`${start.y + 1} / ${start.y + size.y + 1}`);

	onMount(() => {
		console.log(`${id} mounted`);

		return () => {
			console.log(`${id} unmounted`);
		};
	});
</script>

<div
	style="grid-column: {_grid_col_classes}; grid-row: {_grid_row_classes};"
	class="border-surface-950-50 box-border flex flex-col items-center border-2"
>
	<h4 class="h4 w-full text-center">{_name}</h4>

	{#if loading}
		<div class="placeholder w-full flex-grow animate-pulse"></div>
	{:else}
		<div class="w-full flex-grow {containerClasses}">
			{@render children?.()}
		</div>
	{/if}
</div>
