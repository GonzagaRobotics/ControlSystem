<script lang="ts">
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };
	export let name: string;
	export let loading: boolean = false;
	export let containerClasses: string = '';

	$: _loadingClasses = loading ? 'placeholder animate-pulse rounded-none' : '';
	$: _grid_col_classes = `${start.x + 1} / ${start.x + size.x + 1}`;
	$: _grid_row_classes = `${start.y + 1} / ${start.y + size.y + 1}`;
</script>

<div
	style="grid-column: {_grid_col_classes}; grid-row: {_grid_row_classes};"
	class="box-border flex flex-col items-center border-2 rounded-container-token border-secondary-300"
>
	<h3 class="w-full h4 text-center">{name}</h3>
	<div class="w-full flex-grow {containerClasses} {_loadingClasses}">
		{#if loading == false}
			<slot name="main" />
		{/if}
	</div>
</div>
