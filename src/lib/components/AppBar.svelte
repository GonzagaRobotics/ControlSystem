<script lang="ts">
	import type { Core } from '$lib/core/core';
	import { AppBar, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { writable } from 'svelte/store';
	import Connection from './Connection.svelte';
	import { getContext } from 'svelte';

	const core = getContext<Core>('core');
	const config = core.config;

	const currentTab = writable('');

	core.config.subscribe((config) => {
		if (config && $currentTab == '' && config.window.tabs.length > 0) {
			$currentTab = config.window.tabs[0].id;
		}
	});
</script>

<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
	<svelte:fragment slot="lead">
		<h1 class="text-xl">Control System</h1>
	</svelte:fragment>

	<TabGroup>
		{#each $config?.window.tabs ?? [] as tab}
			<Tab bind:group={$currentTab} name={tab.id} value={tab.id}>{tab.name}</Tab>
		{/each}
	</TabGroup>

	<svelte:fragment slot="trail">
		<Connection />
	</svelte:fragment>
</AppBar>
