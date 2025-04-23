<script lang="ts">
	import { Core } from '$lib/core/core.svelte';
	import { Tabs } from '@skeletonlabs/skeleton-svelte';
	import { getContext } from 'svelte';

	let { selectedTab = $bindable() } = $props();

	const core = getContext<Core>('core');

	// Warn the user if we are faking the connection or are not doing heartbeats
	let warningText = '';

	if (core.config.fakeConnect) {
		warningText = 'Connection Faked';
	} else if (core.config.noHeartbeat) {
		warningText = 'Heartbeats Disabled';
	}
</script>

<header class="grid grid-cols-3 items-center">
	<div></div>

	<Tabs value={selectedTab} onValueChange={(e) => (selectedTab = e.value)} fluid>
		{#snippet list()}
			{#each core.config.tabs as tab}
				<Tabs.Control value={tab.id}>{tab.name}</Tabs.Control>
			{/each}
		{/snippet}
	</Tabs>

	<div></div>
</header>
