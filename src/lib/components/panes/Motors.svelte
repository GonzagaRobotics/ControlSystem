<script lang="ts">
	import { Topic } from '$lib/comm/topic';
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import type { AxisInputOptions } from '$lib/input/inputSystem';

	let { start } = $props();

	const baseAxisOptions: AxisInputOptions = {
		curve: 1.5
	};

	type DriveCommand = { forward_backward: number; left_right: number };

	const core = getContext<Core>('core');
	const tabAttributes = getContext<() => string[]>('tabAttributes');

	const driveTopic = new Topic<DriveCommand>(
		core.ros,
		'/drive/command',
		'drive_interfaces/DriveCommand'
	);

	const forwardAxis = core.input.registerAxisInput('LY', baseAxisOptions);
	const turnAxis = core.input.registerAxisInput('LX', baseAxisOptions);

	let readonly = $derived(tabAttributes().includes('motors_readonly'));

	$effect(() => {
		if (readonly == false) {
			driveTopic.publish({ forward_backward: $forwardAxis, left_right: $turnAxis * 0.75 });
		}
	});
</script>

<Pane
	name="Motors"
	{start}
	size={{ x: 1, y: 1 }}
	containerClasses="flex flex-col justify-center items-center"
>
	{#if readonly}
		<h4 class="text-warning-500 h4">No controller input will be sent.</h4>
	{:else}
		<h4 class="h4">Controller input is active.</h4>
	{/if}
</Pane>
