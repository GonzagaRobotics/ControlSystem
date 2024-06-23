<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { setContext } from 'svelte';
	import type { PageData } from './$types';
	import { writable } from 'svelte/store';
	import { paneList } from '$lib/components/panes/paneList';

	export let data: PageData;

	const core = new Core(data.config);
	setContext('core', core);

	const selectedTab = writable(core.config.window.tabs.at(0)?.id ?? '');
	$: selectedTabObj = core.config.window.tabs.find((tab) => tab.id === $selectedTab);

	function getComponent(paneId: string) {
		if (!(paneId in paneList)) {
			console.error(`No component found for pane ID: ${paneId}`);

			return paneList.unknown;
		}

		return paneList[paneId as keyof typeof paneList];
	}
</script>

<main class="w-[100vw] h-[100vh] flex flex-col">
	<AppBar {selectedTab} />

	<div class="w-full h-full grid grid-cols-4 grid-rows-2">
		{#each selectedTabObj?.panes ?? [] as pane (pane.id)}
			<svelte:component
				this={getComponent(pane.id)}
				id={pane.id}
				start={pane.position}
				size={pane.size}
			/>
		{/each}
	</div>
</main>
