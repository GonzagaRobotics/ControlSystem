<script lang="ts">
	import type { Core } from '$lib/core/core';
	import { getContext, onMount } from 'svelte';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };
	export let loading: boolean = false;
	export let containerClasses: string = '';

	const core = getContext<Core>('core');

	$: _name = core.config.panes.find((pane) => pane.id === id)?.name ?? 'Unknown';
	$: _loadingClasses = loading ? 'placeholder animate-pulse rounded-none' : '';
	$: _grid_col_classes = `${start.x + 1} / ${start.x + size.x + 1}`;
	$: _grid_row_classes = `${start.y + 1} / ${start.y + size.y + 1}`;

	onMount(() => {
		console.log(id + ' mounted');

		return () => {
			console.log(id + ' unmounted');
		};
	});
</script>

<div
	style="grid-column: {_grid_col_classes}; grid-row: {_grid_row_classes};"
	class="box-border flex flex-col items-center border-2 rounded-container-token border-secondary-300"
>
	<h3 class="w-full h4 text-center">{_name}</h3>
	<div class="w-full flex-grow {containerClasses} {_loadingClasses}">
		{#if loading == false}
			<slot name="main" />
		{/if}
	</div>
</div>
