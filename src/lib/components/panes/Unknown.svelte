<script lang="ts">
	import Pane from './Pane.svelte';

	let { start } = $props();
</script>

<Pane name="Unknown" {start} size={{ x: 1, y: 1 }} containerClasses="flex items-center">
	<h3 class="h3 text-center">
		A pane is supposed to be here, but its component could not be found.
	</h3>
</Pane>
