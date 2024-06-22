<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { onMount, setContext } from 'svelte';

	const core = new Core();
	setContext('core', core);

	onMount(async () => {
		await core.init();
	});
</script>

<main class="w-[100vw] h-[100vh]">
	<AppBar />
</main>
