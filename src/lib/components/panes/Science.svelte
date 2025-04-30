<script lang="ts">
	import type { Core } from '$lib/core/core.svelte';
	import { Topic } from '$lib/comm/topic';
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';

	let { id, start, size } = $props();

	const core = getContext<Core>('core');

	const augerVerticalTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/vertical',
		'std_msgs/Float32'
	);
	const augerVerticalUp = core.input.registerAxisInput('LT');
	const augerVerticalDown = core.input.registerAxisInput('RT');

	const augerDrillTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/drill',
		'std_msgs/Float32'
	);
	const augerDrill = core.input.registerAxisInput('LY');

	const augerActuateTopic = new Topic<{ data: number }>(
		core.ros,
		'/science/auger/actuate',
		'std_msgs/Float32'
	);
	const augerActuateUp = core.input.registerButtonInput('Y');
	const augerActuateDown = core.input.registerButtonInput('B');

	$effect(() => {
		augerVerticalTopic.publish({ data: $augerVerticalUp - $augerVerticalDown });
		augerDrillTopic.publish({ data: $augerDrill });

		augerActuateTopic.publish({
			data: ($augerActuateUp ? 1 : 0) - ($augerActuateDown ? 1 : 0)
		});
	});
</script>

<Pane {id} {start} {size}>
	<div>
		<div>Auger Vertical Input: {$augerVerticalUp - $augerVerticalDown}</div>

		<div>Auger Drill Input: {$augerDrill}</div>

		<div>Auger Actuate Input: {($augerActuateUp ? 1 : 0) - ($augerActuateDown ? 1 : 0)}</div>
	</div>
</Pane>
