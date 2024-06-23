<script lang="ts">
	import Pane from './Pane.svelte';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };
</script>

<Pane {id} {start} {size} containerClasses="flex items-center">
	<svelte:fragment slot="main">
		<h3 class="h3 text-center">
			A pane '{id}' is supposed to be here, but a corresponding component could not be found.
		</h3>
	</svelte:fragment>
</Pane>
