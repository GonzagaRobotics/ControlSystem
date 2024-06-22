<script lang="ts">
	import '../app.postcss';

	// Floating UI for Popups
	import { computePosition, autoUpdate, flip, shift, offset, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, flip, shift, offset, arrow });

	// Skeleton features
	import { initializeStores, Toast } from '@skeletonlabs/skeleton';
	initializeStores();
</script>

<svelte:head>
	<title>Control System</title>
</svelte:head>

<Toast />
<slot />
