<script lang="ts">
	import Pane from './Pane.svelte';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };
</script>

<Pane {id} {start} {size}>
	<svelte:fragment slot="main">Hello!</svelte:fragment>
</Pane>
