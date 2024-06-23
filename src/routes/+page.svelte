<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { setContext } from 'svelte';
	import type { PageData } from './$types';

	export let data: PageData;

	const core = new Core(data.config);
	setContext('core', core);
</script>

<main class="w-[100vw] h-[100vh]">
	<AppBar />
</main>
