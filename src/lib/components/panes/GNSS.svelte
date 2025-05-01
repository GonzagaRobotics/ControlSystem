<script lang="ts">
	import Pane from './Pane.svelte';

	let { start } = $props();
</script>

<Pane name="GNSS" {start} size={{ x: 1, y: 1 }}></Pane>
