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
	const baseAxis = core.input.registerAxisInput('RX');

	$: baseTopic.publish({ data: $baseAxis });

	const shoulderTopic = new Topic<{ data: number }>(core.ros, '/arm/shoulder', 'std_msgs/Float32');
	const shoulderAxis = core.input.registerAxisInput('LY');

	$: shoulderTopic.publish({ data: $shoulderAxis});

	const forearmTopic = new Topic<{ data: number }>(core.ros, '/arm/forearm', 'std_msgs/Float32');
	const forearmAxis = core.input.registerAxisInput('RY');

	$: forearmTopic.publish({ data: $forearmAxis });
	// $: shoulderTopic.publish({ data: $forearmAxis });

	const wristTopic = new Topic<{ data: number }>(core.ros, '/arm/wrist', 'std_msgs/Float32');
	const wristOpenAxis = core.input.registerAxisInput('LT');
	const wristCloseAxis = core.input.registerAxisInput('RT');


	$: wristTopic.publish({ data: Math.max(0, $wristOpenAxis) - Math.max($wristCloseAxis, 0)});
	
    const grabberTopic = new Topic<{ data: number }>(
    	core.ros,
    	'/arm/minor/grabber',
    	'std_msgs/Int32'
    );
    const grabberOpen = core.input.registerButtonInput('B');
    const grabberClose = core.input.registerButtonInput('A');
                                                                                                     
    $: grabberTopic.publish({ data: ($grabberOpen? 1 : 0) - ($grabberClose? 1 : 0) });


</script>

<Pane {id} {start} {size}>
	<svelte:fragment slot="main"></svelte:fragment>
</Pane>
