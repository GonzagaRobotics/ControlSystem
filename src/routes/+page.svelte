<script lang="ts">
	import { page } from '$app/state';
	import { Core } from '$lib/core/core.svelte';
	import { toaster } from '$lib/core/toaster';
	import { setContext } from 'svelte';

	const core = new Core(page.data.config, toaster);
	setContext('core', core);
</script>
