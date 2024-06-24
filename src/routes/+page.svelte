<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { setContext } from 'svelte';
	import type { PageData } from './$types';
	import { derived, writable } from 'svelte/store';
	import { paneList } from '$lib/components/panes/paneList';
	import { beforeNavigate } from '$app/navigation';

	export let data: PageData;

	const core = new Core(data.config);
	setContext('core', core);

	const selectedTab = writable(core.config.tabs.at(0)?.id ?? '');
	$: selectedTabObj = core.config.tabs.find((tab) => tab.id === $selectedTab);

	const currentAttributes = derived(selectedTab, ($selectedTab) => {
		return core.config.tabs.find((tab) => tab.id === $selectedTab)?.attributes ?? [];
	});
	setContext('currentAttributes', currentAttributes);

	beforeNavigate((navigation) => {
		if (navigation.type == 'leave') {
			core.disconnect();
		}
	});

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
