<script lang="ts">
	import { Topic } from '$lib/comm/topic';
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core.svelte';

	let { id, start, size } = $props();

	const core = getContext<Core>('core');

	const topic = new Topic(core.ros, '/foo', 'std_msgs/Empty');

	// $effect(() => {
	// 	return () => {
	// 		topic.publish(null);
	// 	};
	// });
</script>

<Pane {id} {start} {size}></Pane>
