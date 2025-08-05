<script lang="ts">
	import { Toaster } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/core/toaster';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Control System</title>
</svelte:head>

<Toaster {toaster}></Toaster>

{@render children()}
