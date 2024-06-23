<script lang="ts">
	import Pane from './Pane.svelte';

	export let start: { x: number; y: number };
	export let size: { x: number; y: number };
</script>

<Pane {start} {size} name="Test">
	<svelte:fragment slot="main">Hello!</svelte:fragment>
</Pane>
