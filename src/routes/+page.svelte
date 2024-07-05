<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { onMount, setContext, SvelteComponent } from 'svelte';
	import type { PageData } from './$types';
	import { derived, writable } from 'svelte/store';
	import { paneList } from '$lib/components/panes/paneList';
	import { beforeNavigate } from '$app/navigation';
	import { getToastStore } from '@skeletonlabs/skeleton';

	export let data: PageData;

	const core = new Core(data.config, getToastStore());
	setContext('core', core);

	const selectedTab = writable(core.config.tabs.at(0)?.id ?? '');
	$: selectedTabObj = core.config.tabs.find((tab) => tab.id === $selectedTab);

	const tabAttributes = derived(selectedTab, ($selectedTab) => {
		return core.config.tabs.find((tab) => tab.id === $selectedTab)?.attributes ?? [];
	});
	setContext('tabAttributes', tabAttributes);

	const paneComponents = new Array<SvelteComponent>(4 * 2);

	beforeNavigate((navigation) => {
		if (navigation.type == 'leave') {
			// To prevent any issues with the components not being destroyed properly,
			// we manually destroy them here so we can be sure any cleanup code is run
			// before the core is disposed.
			for (const component of paneComponents) {
				component?.$destroy();
			}

			core.dispose();
		}
	});

	let lastTickTimestamp: number | undefined;

	function tick(timestamp: number) {
		if (lastTickTimestamp == undefined) {
			lastTickTimestamp = timestamp;
		}

		const delta = timestamp - lastTickTimestamp;

		core.tick(delta);

		lastTickTimestamp = timestamp;
		requestAnimationFrame(tick);
	}

	onMount(() => {
		requestAnimationFrame(tick);
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
		{#await core.init()}
			<div class="col-span-4 row-span-2 flex justify-center items-center">
				<h1 class="h1">Conecting to Rover...</h1>
			</div>
		{:then}
			{#each selectedTabObj?.panes ?? [] as pane (pane.id)}
				<svelte:component
					this={getComponent(pane.id)}
					id={pane.id}
					start={pane.position}
					size={pane.size}
					bind:this={paneComponents[pane.position.y * 4 + pane.position.x]}
				/>
			{/each}
		{:catch error}
			<div class="col-span-4 row-span-2 flex justify-center items-center">
				<h1 class="h1">{error}</h1>
			</div>
		{/await}
	</div>
</main>
