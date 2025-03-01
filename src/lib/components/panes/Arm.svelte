<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';
	import type { AxisInputOptions } from '$lib/input/inputSystem';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');
	const baseAxisOptions: AxisInputOptions = { curve: 1.75 };

	let requirePress = false;
	$: allowMovement = false;
	$: maxArmSpeed = 1.0;
	$: safetyMultiplier = (!requirePress || allowMovement ? 1 : 0) * maxArmSpeed;

	const baseTopic = new Topic<{ data: number }>(core.ros, '/arm/base', 'std_msgs/Float32');
	const baseLeftAxis = core.input.registerAxisInput('LT', baseAxisOptions);
	const baseRightAxis = core.input.registerAxisInput('RT', baseAxisOptions);

	$: baseTopic.publish({ data: ($baseLeftAxis - $baseRightAxis) * safetyMultiplier });

	const shoulderTopic = new Topic<{ data: number }>(core.ros, '/arm/shoulder', 'std_msgs/Float32');
	const shoulderAxis = core.input.registerAxisInput('LY', baseAxisOptions);

	$: shoulderTopic.publish({ data: -$shoulderAxis * safetyMultiplier });

	const forearmTopic = new Topic<{ data: number }>(core.ros, '/arm/forearm', 'std_msgs/Float32');
	const forearmAxis = core.input.registerAxisInput('RY', baseAxisOptions);

	$: forearmTopic.publish({ data: $forearmAxis * safetyMultiplier });

	const wristTopic = new Topic<{ data: number }>(core.ros, '/arm/wrist', 'std_msgs/Float32');
	const wristOpenButton = core.input.registerButtonInput('A');
	const wristCloseButton = core.input.registerButtonInput('B');
	false
	$: wristTopic.publish({
		data: (($wristOpenButton ? 1 : 0) - ($wristCloseButton ? 1 : 0)) * safetyMultiplier
	});
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
