<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	const baseTopic = new Topic<{ data: number }>(core.ros, '/arm/base', 'std_msgs/Float32');
	const baseLeftAxis = core.input.registerAxisInput('LT', 1.75);
	const baseRightAxis = core.input.registerAxisInput('RT', 1.75);

	$: baseTopic.publish({ data: $baseLeftAxis - $baseRightAxis });

	const shoulderTopic = new Topic<{ data: number }>(core.ros, '/arm/shoulder', 'std_msgs/Float32');
	const shoulderAxis = core.input.registerAxisInput('LY', 1.75);

	$: shoulderTopic.publish({ data: -$shoulderAxis });

	const forearmTopic = new Topic<{ data: number }>(core.ros, '/arm/forearm', 'std_msgs/Float32');
	const forearmAxis = core.input.registerAxisInput('RY', 1.75);

	$: forearmTopic.publish({ data: $forearmAxis });

	const wristTopic = new Topic<{ data: number }>(core.ros, '/arm/wrist', 'std_msgs/Float32');
	const wristOpenButton = core.input.registerButtonInput('A');
	const wristCloseButton = core.input.registerButtonInput('B');

	$: wristTopic.publish({ data: ($wristOpenButton ? 1 : 0) - ($wristCloseButton ? 1 : 0) });
</script>

<Pane {id} {start} {size}>
	<svelte:fragment slot="main"></svelte:fragment>
</Pane>
