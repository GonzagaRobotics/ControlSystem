<script lang="ts">
	import Heartbeat from '~icons/mdi/heart-pulse';
	import { getContext } from 'svelte';
	import { type Core } from '$lib/core/core';

	const core = getContext<Core>('core');
	const state = core.state;
</script>

<div class="flex flex-row justify-center items-center gap-1">
	<Heartbeat style="font-size: 2em;" />
	<p>
		{$state.latency?.toFixed(0) ?? '--'} ms
	</p>
</div>
