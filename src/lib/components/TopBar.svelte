<script lang="ts">
	import { Core } from '$lib/core/core.svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { getContext } from 'svelte';
	import Connection from './Connection.svelte';
	import Gamepad from './Gamepad.svelte';
	import Latency from './Latency.svelte';

	let { selectedTab = $bindable() } = $props();

	const core = getContext<Core>('core');

	// Warn the user if we are faking the connection or are not doing heartbeats
	let warningText = core.config.fakeConnect
		? 'Connection Faked'
		: core.config.noHeartbeat
			? 'Heartbeats Disabled'
			: '';
</script>

<header class="grid grid-cols-3 items-center">
	<div class="flex flex-row items-center gap-4">
		<h4 class="h4">Control System</h4>

		{#if warningText}
			<h4 class="h4 text-warning-500">{warningText}</h4>
		{/if}
	</div>

	<Tabs value={selectedTab} onValueChange={(e) => (selectedTab = e.value)} fluid listMargin="0">
		{#snippet list()}
			{#each core.config.tabs as tab}
				<Tabs.Control value={tab.id}>{tab.name}</Tabs.Control>
			{/each}
		{/snippet}
	</Tabs>

	<div class="flex flex-row items-center justify-end gap-4">
		<!-- <Latency /> -->
		<Connection />
		<Gamepad />
	</div>
</header>
