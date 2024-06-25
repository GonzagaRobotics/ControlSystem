<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import type { Readable } from 'svelte/store';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	type WheelStatus = {
		desiredPower: number;
		actualPower: number;
		currentRPM: number;
		controlActive: boolean;
	};

	type MotorsStatus = {
		enabled: boolean;
		wheels: WheelStatus[];
	};

	const core = getContext<Core>('core');
	const tabAttributes = getContext<Readable<string[]>>('tabAttributes');

	const motorsStatusTopic = new Topic<MotorsStatus>(
		core.ros,
		'/drive_system/status',
		'drive_system_interfaces/SystemStatus'
	);
	const motorStatus = motorsStatusTopic.subscribe();
</script>

<Pane {id} {start} {size} loading={$motorStatus == undefined}>
	<svelte:fragment slot="main"></svelte:fragment>
</Pane>
