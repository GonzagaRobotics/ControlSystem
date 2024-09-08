<script lang="ts">
	import Heartbeat from '~icons/mdi/heart-pulse';
	import { getContext } from 'svelte';
	import { type Core } from '$lib/core/core';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	const core = getContext<Core>('core');
	const state = core.state;

	$: latencyHistory = Array<number>();
	$: rollingLatency = -1;

	state.subscribe((value) => {
		if (value.latency == undefined) return;

		latencyHistory.push(value.latency);
		if (latencyHistory.length > 5) {
			latencyHistory.shift();
		}

		rollingLatency = latencyHistory.reduce((a, b) => a + b, 0);
		rollingLatency /= latencyHistory.length;
	});

	$: _heartbeatClasses = $state.connection == 'connected' ? 'animate-heartbeat' : '';

	$: _textClasses =
		rollingLatency > core.config.heartbeat.heartbeatInterval ? 'text-warning-500' : '';

	function formatNumber(n: number) {
		if (n < 0) return '--';

		if (n < 1000) return n.toFixed(0);

		return (n / 1000).toFixed(2);
	}

	function formatUnit(n: number) {
		if (n < 0) return '';

		if (n < 1000) return 'ms';

		return 's';
	}
</script>

<div class="flex flex-row justify-start items-center gap-1 min-w-28">
	<Heartbeat class={_heartbeatClasses} style="font-size: 2em;" />
	{#key rollingLatency}
		<p class="h3 {_textClasses}" in:scale={{ duration: 500, start: 0.85, easing: backOut }}>
			{formatNumber(rollingLatency)}
		</p>
	{/key}
	{#key formatUnit(rollingLatency)}
		<p class="h3 {_textClasses}" in:scale={{ duration: 500, start: 0.85, easing: backOut }}>
			{formatUnit(rollingLatency)}
		</p>
	{/key}
</div>
