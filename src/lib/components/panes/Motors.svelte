<script lang="ts">
	import { getContext, tick } from 'svelte';
	import Pane from './Pane.svelte';
	import type { Readable } from 'svelte/store';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	type Vector3 = { x: number; y: number; z: number };

	function clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}

	const core = getContext<Core>('core');
	const tabAttributes = getContext<Readable<string[]>>('tabAttributes');
	$: readonly = $tabAttributes.includes('motors_readonly');

	const driveTopic = new Topic<Vector3>(core.ros, '/drive_system/drive', 'geometry_msgs/Vector3');

	const forwardAxis = core.input.registerAxisInput('LY');
	const turnAxis = core.input.registerAxisInput('LX');

	$: left = clamp($forwardAxis + $turnAxis, -1, 1);
	$: right = clamp($forwardAxis - $turnAxis, -1, 1);

	$: {
		if (!readonly) {
			driveTopic.publish({ x: left, y: right, z: 0 });
		}
	}
</script>

<Pane {id} {start} {size} containerClasses="flex flex-col justify-end items-center">
	<svelte:fragment slot="main">
		<div class="flex-grow flex flex-row justify-center items-center">
			<p class="w-1/4 h3 text-right">{(left * 100).toFixed(0)}%</p>
			<img class="w-1/2" src="/rover_top_filled.png" alt="" />
			<p class="w-1/4 h3 text-left">{(right * 100).toFixed(0)}%</p>
		</div>

		{#if readonly}
			<div class="text-warning-500 h4">No controller input will be sent.</div>
		{/if}
	</svelte:fragment>
</Pane>
