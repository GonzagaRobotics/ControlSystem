<script lang="ts">
	import { page } from '$app/state';
	import TopBar from '$lib/components/TopBar.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { toaster } from '$lib/core/toaster';
	import { setContext } from 'svelte';

	const core = new Core(page.data.config, toaster);
	setContext('core', core);

	let selectedTab = $state(core.config.tabs.at(0)?.id ?? '');
</script>

<main class="flex h-full flex-col">
	<TopBar bind:selectedTab />
</main>
