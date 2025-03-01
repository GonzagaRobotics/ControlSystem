<script lang="ts">
	import { Core } from '$lib/core/core';
	import { getContext } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import Controller from '~icons/mdi/microsoft-xbox-controller';
	import NoController from '~icons/mdi/microsoft-xbox-controller-off';

	const core = getContext<Core>('core');
	const gamepadConnected = core.input.gamepadConnected;
</script>

{#key $gamepadConnected}
	<div style="font-size: 2.25em;" in:scale={{ easing: backOut, start: 0.25 }}>
		{#if $gamepadConnected}
			<Controller></Controller>
		{:else}
			<NoController></NoController>
		{/if}
	</div>
{/key}
