<script lang="ts">
	import Pane from './Pane.svelte';

	let { id, start, size } = $props();
</script>

<Pane {id} {start} {size} containerClasses="flex items-center">
	<h3 class="h3 text-center">
		A pane '{id}' is supposed to be here, but a corresponding component could not be found.
	</h3>
</Pane>
