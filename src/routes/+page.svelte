<script lang="ts">
	import AppBar from '$lib/components/AppBar.svelte';
	import { Core } from '$lib/core/core';
	import { setContext } from 'svelte';
	import type { PageData } from './$types';
	import Test from '$lib/components/panes/Test.svelte';

	export let data: PageData;

	const core = new Core(data.config);
	setContext('core', core);
</script>

<main class="w-[100vw] h-[100vh] flex flex-col">
	<AppBar />

	<div class="w-full h-full grid grid-cols-4 grid-rows-2">
		<Test start={{ x: 0, y: 0 }} size={{ x: 2, y: 2 }} />
		<Test start={{ x: 2, y: 0 }} size={{ x: 2, y: 2 }} />
	</div>
</main>
