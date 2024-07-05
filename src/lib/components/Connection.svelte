<script lang="ts">
	import Disconnected from '~icons/mdi/lan-disconnect';
	import Connecting from '~icons/mdi/lan-pending';
	import Connected from '~icons/mdi/lan-connect';
	import { getContext } from 'svelte';
	import { type Core } from '$lib/core/core';

	const core = getContext<Core>('core');
	const state = core.state;
</script>

<div style="font-size: 2em;">
	{#if $state.connection == 'connected'}
		<Connected class="text-success-500" />
	{:else if $state.connection == 'disconnected' || $state.connection == 'failed'}
		<Disconnected class="text-warning-500" />
	{:else}
		<Connecting class="animate-pulse-fast" />
	{/if}
</div>
