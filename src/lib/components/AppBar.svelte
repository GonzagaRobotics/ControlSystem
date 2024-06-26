<script lang="ts">
	import type { Core } from '$lib/core/core';
	import { AppBar, Tab, TabGroup } from '@skeletonlabs/skeleton';
	import { type Writable } from 'svelte/store';
	import Connection from './Connection.svelte';
	import { getContext } from 'svelte';
	import Gamepad from './Gamepad.svelte';

	export let selectedTab: Writable<string>;

	const core = getContext<Core>('core');
</script>

<AppBar gridColumns="grid-cols-3" slotDefault="place-self-center" slotTrail="place-content-end">
	<svelte:fragment slot="lead">
		<h1 class="h3">Control System</h1>
	</svelte:fragment>

	<TabGroup>
		{#each core.config.tabs as tab}
			<Tab bind:group={$selectedTab} name={tab.id} value={tab.id}>{tab.name}</Tab>
		{/each}
	</TabGroup>

	<svelte:fragment slot="trail">
		<Connection />
		<Gamepad />
	</svelte:fragment>
</AppBar>
