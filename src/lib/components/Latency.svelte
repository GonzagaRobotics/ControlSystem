<script lang="ts">
	import { HeartPulse } from '@lucide/svelte';
	import { getContext, untrack } from 'svelte';
	import { type Core } from '$lib/core/core.svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';

	const core = getContext<Core>('core');

	let latencyHistory = $state(Array<number>());

	$effect(() => {
		if (core.state.latency == undefined) return;

		latencyHistory.push(core.state.latency);

		untrack(() => {
			if (latencyHistory.length > 5) {
				latencyHistory.shift();
			}
		});
	});

	let rollingLatency = $derived.by(() => {
		if (latencyHistory.length == 0) return -1;

		return latencyHistory.reduce((a, b) => a + b, 0) / latencyHistory.length;
	});

	// $: _heartbeatClasses = $state.connection == 'connected' ? 'animate-heartbeat' : '';

	let _textClasses = $derived(
		rollingLatency > core.config.heartbeat.heartbeatInterval ? 'text-warning-500' : ''
	);

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

<div class="flex min-w-28 flex-row items-center justify-start gap-1">
	<HeartPulse size="2.5rem" />

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
