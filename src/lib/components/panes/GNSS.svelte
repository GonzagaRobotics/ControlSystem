<script lang="ts">
	import Pane from './Pane.svelte';

	let { id, start, size } = $props();
</script>

<Pane {id} {start} {size}></Pane>
