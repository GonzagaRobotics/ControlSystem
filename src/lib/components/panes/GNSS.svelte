<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { Topic } from '$lib/comm/topic';

	type GNSS = {
		// lat, long, alt
		position: {
			x: number;
			y: number;
			z: number;
		};
		// pitch, roll, yaw
		rotation: {
			x: number;
			y: number;
			z: number;
		};
		magHeading: number;
	};

	let { start } = $props();

	const core = getContext<Core>('core');

	const gnssTopic = new Topic<GNSS>(core.ros, 'gnss', 'gnss_interfaces/GNSS');
	const gnss = gnssTopic.subscribe();

	let canvas = $state<HTMLCanvasElement | null>(null);
	let ctx = $state<CanvasRenderingContext2D | null>(null);
	let width = $state(0);
	let height = $state(0);

	$effect(() => {
		if (!canvas) {
			return;
		}

		if (!ctx) {
			ctx = canvas.getContext('2d')!;
		}

		canvas.width = width;
		canvas.height = height;

		ctx.fillStyle = 'brown';
		ctx.fillRect(0, 0, width, height);
	});
</script>

{#snippet dataText(text: string)}
	<p class="text-center font-mono">{text}</p>
{/snippet}

<Pane
	name="GNSS"
	{start}
	size={{ x: 1, y: 1 }}
	containerClasses="flex flex-col"
	loading={!core.config.fakeConnect && !$gnss}
>
	<div class="grid grid-cols-3 grid-rows-2">
		{@render dataText(`Lat: ${$gnss?.position.x ?? 'XX.XXXXXX'}`)}
		{@render dataText(`Lon: ${$gnss?.position.y ?? 'XX.XXXXX'}`)}
		{@render dataText(`Alt: ${$gnss?.position.z ?? 'XXXX.XX'}`)}
		{@render dataText(`Pitch: ${$gnss?.rotation.x ?? 'XX.XX'}`)}
		{@render dataText(`Roll: ${$gnss?.rotation.y ?? 'XX.XX'}`)}
		{@render dataText(`Mag: ${$gnss?.magHeading ?? 'XXX.XX'}`)}
	</div>

	<div class="h-full" bind:clientWidth={width} bind:clientHeight={height}>
		<canvas bind:this={canvas}></canvas>
	</div>
</Pane>
