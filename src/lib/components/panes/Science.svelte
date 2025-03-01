<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	const augerVerticalTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/vertical',
		'std_msgs/Float32'
	);
	const augerVerticalUp = core.input.registerAxisInput('LT');
	const augerVerticalDown = core.input.registerAxisInput('RT');

	$: augerVerticalTopic.publish({ data: $augerVerticalUp - $augerVerticalDown });

	const augerDrillTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/drill',
		'std_msgs/Float32'
	);
	const augerDrill = core.input.registerAxisInput('LY');

	$: augerDrillTopic.publish({ data: $augerDrill });

	const augerActuateTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/actuate',
		'std_msgs/Float32'
	);
	const augerActuateUp = core.input.registerButtonInput('Y');
	const augerActuateDown = core.input.registerButtonInput('B');

	$: augerActuateTopic.publish({ data: ($augerActuateUp ? 1 : 0) - ($augerActuateDown ? 1 : 0) });
</script>

<Pane {id} {start} {size} containerClasses="flex items-center">
	<svelte:fragment slot="main">
		<div>
			<div>Auger Vertical Input: {$augerVerticalUp - $augerVerticalDown}</div>

			<div>Auger Drill Input: {$augerDrill}</div>

			<div>Auger Actuate Input: {($augerActuateUp ? 1 : 0) - ($augerActuateDown ? 1 : 0)}</div>
		</div>
	</svelte:fragment>
</Pane>
