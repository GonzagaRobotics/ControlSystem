<script lang="ts">
	import { Topic } from '$lib/comm/topic';
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import type { AxisInputOptions } from '$lib/input/inputSystem';

	let { id, start, size } = $props();

	const baseAxisOptions: AxisInputOptions = {
		curve: 1.5
	};

	type Vector3 = { x: number; y: number; z: number };

	const core = getContext<Core>('core');
	const tabAttributes = getContext<() => string[]>('tabAttributes');

	const driveTopic = new Topic<Vector3>(core.ros, '/drive_system/drive', 'geometry_msgs/Vector3');

	const forwardAxis = core.input.registerAxisInput('LY', baseAxisOptions);
	const turnAxis = core.input.registerAxisInput('LX', baseAxisOptions);

	let readonly = $derived(tabAttributes().includes('motors_readonly'));

	$effect(() => {
		if (readonly == false) {
			driveTopic.publish({ x: $forwardAxis, y: $turnAxis * 0.75, z: 0 });
		}
	});
</script>

<Pane {id} {start} {size} containerClasses="flex flex-col justify-center items-center">
	{#if readonly}
		<h4 class="text-warning-500 h4">No controller input will be sent.</h4>
	{:else}
		<h4 class="h4">Controller input is active.</h4>
	{/if}
</Pane>
