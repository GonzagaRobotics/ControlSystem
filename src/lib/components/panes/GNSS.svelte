<script lang="ts">
	import { onMount } from 'svelte';
	import Pane from './Pane.svelte';

	let { start } = $props();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	let width = $state(0);
	let height = $state(0);

	$effect(() => {
		if (!canvas || !ctx) {
			return;
		}

		canvas.width = width;
		canvas.height = height;

		ctx.fillStyle = 'brown';
		ctx.fillRect(0, 0, width, height);
	});

	onMount(() => {
		const context = canvas!.getContext('2d');

		if (context == null) {
			console.error('Failed to get canvas context');

			return;
		}

		ctx = context;
	});
</script>

{#snippet dataText(text: string)}
	<p class="text-center font-mono text-lg">{text}</p>
{/snippet}

<Pane name="GNSS" {start} size={{ x: 1, y: 1 }} containerClasses="flex flex-col">
	<div class="grid grid-cols-2 grid-rows-2">
		{@render dataText('Lat: XX.XXXXXX°')}
		{@render dataText('Lon: XX.XXXXXX°')}
		{@render dataText('Alt: XXXX.XX m')}
		{@render dataText('Mag: XXX.XX°')}
	</div>

	<div class="h-full" bind:clientWidth={width} bind:clientHeight={height}>
		<canvas bind:this={canvas}></canvas>
	</div>
</Pane>
