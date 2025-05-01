<script lang="ts">
	import type { Core } from '$lib/core/core.svelte';
	import type { AxisInputOptions } from '$lib/input/inputSystem';
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Topic } from '$lib/comm/topic';

	let { start } = $props();

	const core = getContext<Core>('core');
	const baseAxisOptions: AxisInputOptions = { curve: 1.75 };

	let requirePress = $state(false);
	let allowMovement = $state(false);
	let maxArmSpeed = $state(1.0);
	let safetyMultiplier = $derived((!requirePress || allowMovement ? 1 : 0) * maxArmSpeed);

	const baseTopic = new Topic<{ data: number }>(core.ros, '/arm/base', 'std_msgs/Float32');
	const baseLeftAxis = core.input.registerAxisInput('LT', baseAxisOptions);
	const baseRightAxis = core.input.registerAxisInput('RT', baseAxisOptions);

	const shoulderTopic = new Topic<{ data: number }>(core.ros, '/arm/shoulder', 'std_msgs/Float32');
	const shoulderAxis = core.input.registerAxisInput('LY', baseAxisOptions);

	const forearmTopic = new Topic<{ data: number }>(core.ros, '/arm/forearm', 'std_msgs/Float32');
	const forearmAxis = core.input.registerAxisInput('RY', baseAxisOptions);

	const wristTopic = new Topic<{ data: number }>(core.ros, '/arm/wrist', 'std_msgs/Float32');
	const wristOpenButton = core.input.registerButtonInput('A');
	const wristCloseButton = core.input.registerButtonInput('B');

	$effect(() => {
		baseTopic.publish({ data: ($baseLeftAxis - $baseRightAxis) * safetyMultiplier });
		shoulderTopic.publish({ data: -$shoulderAxis * safetyMultiplier });
		forearmTopic.publish({ data: $forearmAxis * safetyMultiplier });

		wristTopic.publish({
			data: (($wristOpenButton ? 1 : 0) - ($wristCloseButton ? 1 : 0)) * safetyMultiplier
		});
	});
</script>

<Pane name="Arm" {start} size={{ x: 1, y: 1 }} containerClasses="flex flex-col gap-2">
	<label for="">
		Require Button Press to Move
		<input type="checkbox" bind:checked={requirePress} />
	</label>

	<label for="">
		Max Arm Speed: {maxArmSpeed * 100}%
		<input type="range" min="0.1" max="1" step="0.1" bind:value={maxArmSpeed} />
	</label>

	<button
		class="btn btn-lg preset-filled-surface-950-50 w-full"
		disabled={!requirePress}
		onmousedown={() => (allowMovement = true)}
		onmouseup={() => (allowMovement = false)}
		onmouseleave={() => (allowMovement = false)}
	>
		{#if allowMovement}
			Release to Stop Movement
		{:else}
			Press to Allow Movement
		{/if}
	</button>

	<p>Total Multiplier: {safetyMultiplier}</p>
</Pane>
