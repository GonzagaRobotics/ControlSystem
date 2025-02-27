<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	// const minorXTopic = new Topic<{ data: number }>(core.ros, '/arm/minor/x', 'std_msgs/Float32');
	// const minorXRight = core.input.registerButtonInput('Left');
	// const minorXLeft = core.input.registerButtonInput('Right');

    // // -1 for left, 1 for right
    // $: minorXTopic.publish({ data: ($minorXLeft? 1 : 0) - ($minorXRight? 1 : 0)  });

	let requirePress = false;
	$: allowMovement = false;
	$: maxArmSpeed = 1.0;
	$: safetyMultiplier = (!requirePress || allowMovement ? 1 : 0) * maxArmSpeed;

	// const baseTopic = new Topic<{ data: number }>(core.ros, '/arm/base', 'std_msgs/Float32');
	// const baseLeftAxis = core.input.registerAxisInput('LT', 1.75);
	// const baseRightAxis = core.input.registerAxisInput('RT', 1.75);

	// $: baseTopic.publish({ data: ($baseLeftAxis - $baseRightAxis) * safetyMultiplier });

	const shoulderTopic = new Topic<{ data: number }>(core.ros, '/arm/shoulder', 'std_msgs/Float32');
	const shoulderAxis = core.input.registerAxisInput('LY', 1.75);

	$: shoulderTopic.publish({ data: -$shoulderAxis * safetyMultiplier });

	const forearmTopic = new Topic<{ data: number }>(core.ros, '/arm/forearm', 'std_msgs/Float32');
	const forearmAxis = core.input.registerAxisInput('RY', 1.75);

	$: forearmTopic.publish({ data: $forearmAxis * safetyMultiplier });

	const wristTopic = new Topic<{ data: number }>(core.ros, '/arm/wrist', 'std_msgs/Float32');
	// const wristOpenAxis = core.input.registerAxisInput('LT');
	// const wristCloseAxis = core.input.registerAxisInput('RT');

    // Chromium maps LT, RT to buttons, firefox maps them to axes inputs
	const wristOpenAxis = core.input.registerButtonInput('LT');
	const wristCloseAxis = core.input.registerButtonInput('RT');

	$: wristTopic.publish({ data: (Math.max(0, $wristOpenAxis) - Math.max($wristCloseAxis, 0)) * safetyMultiplier});
	
    const grabberTopic = new Topic<{ data: number }>(
    	core.ros,
    	'/arm/minor/grabber',
    	'std_msgs/Int32'
    );
    const grabberOpen = core.input.registerButtonInput('B');
    const grabberClose = core.input.registerButtonInput('A');
   
    // 1 for open, -1 for closed
    // $: grabberTopic.publish({ data: allowMovement  ? ((($grabberOpen? 1 : 0) - ($grabberClose? 1 : 0)) : 0 });
    // $: grabberTopic.publish({ data: (allowMovement ? ($grabberOpen? 1 : 0) - ($grabberClose? 1 : 0) )});
    $: grabberTopic.publish({ data: ($grabberOpen? 1 : 0) - ($grabberClose? 1 : 0) });


	const baseTopic = new Topic<{ data: number }>(core.ros, '/arm/base', 'std_msgs/Float32');
	const baseAxis = core.input.registerAxisInput('LX');

	$: baseTopic.publish({ data: ($baseAxis) * safetyMultiplier});
</script>

<Pane {id} {start} {size}>
	<svelte:fragment slot="main">
		<label for="">
			Require Button Press to Move
			<input type="checkbox" bind:checked={requirePress} />
		</label>

		<label for="">
			Max Arm Speed: {maxArmSpeed * 100}%
			<input type="range" min="0.1" max="1" step="0.1" bind:value={maxArmSpeed} />
		</label>

		<button
			class="w-full btn btn-lg variant-filled-primary"
			disabled={!requirePress}
			on:mousedown={() => (allowMovement = true)}
			on:mouseup={() => (allowMovement = false)}
		>
			{#if allowMovement}
				Release to Stop Movement
			{:else}
				Press to Allow Movement
			{/if}
		</button>

		<p>Total Multiplier: {safetyMultiplier}</p>
	</svelte:fragment>
</Pane>
