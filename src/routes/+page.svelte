<script lang="ts">
	import { page } from '$app/state';
	import TopBar from '$lib/components/TopBar.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { toaster } from '$lib/core/toaster';
	import { setContext } from 'svelte';

	const core = new Core(page.data.config, toaster);
	setContext('core', core);

	let selectedTab = $state(core.config.tabs.at(0)?.id ?? '');
	let tabObj = $derived(core.config.tabs.find((tab) => tab.id == selectedTab));
	let tabAttributes = $derived(tabObj?.attributes ?? []);

	setContext('tabAttributes', () => tabAttributes);

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

	$effect(() => {
		requestAnimationFrame(tick);
	});
</script>

{#snippet centeredText(text: string)}
	<div class="col-span-4 row-span-2 flex items-center justify-center">
		<h1 class="h1 text-center">{text}</h1>
	</div>
{/snippet}

<main class="flex h-full flex-col p-2">
	<TopBar bind:selectedTab />

	<div class="grid h-full grid-cols-4 grid-rows-2 gap-2">
		{#await core.init()}
			{@render centeredText('Connecting...')}
		{:then accepted}
			{#if accepted}{:else}
				{@render centeredText('The rover rejected the connection.')}
			{/if}
		{:catch error}
			{@render centeredText(error)}
		{/await}
	</div>
</main>
