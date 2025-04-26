<script lang="ts">
	import { Wifi, WifiOff } from '@lucide/svelte';
	import { getContext } from 'svelte';
	import { type Core } from '$lib/core/core.svelte';

	const core = getContext<Core>('core');
	const state = core.state;
</script>

{#if $state.connection == 'connected'}
	<Wifi class="text-success-500" size="2.5rem" />
{:else if $state.connection == 'disconnected' || $state.connection == 'failed'}
	<WifiOff class="text-warning-500" size="2.5rem" />
{:else}
	<Wifi class="animate-pulse" size="2.5rem" />
{/if}
