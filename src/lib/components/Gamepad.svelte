<script lang="ts">
	import { Core } from '$lib/core/core.svelte';
	import { getContext } from 'svelte';
	import { backOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import { Gamepad2 } from '@lucide/svelte';

	const core = getContext<Core>('core');
	const gamepadConnected = core.input.gamepadConnected;
</script>

{#key $gamepadConnected}
	<div in:scale={{ easing: backOut, start: 0.25 }}>
		{#if $gamepadConnected}
			<Gamepad2 size="2.5rem" class="text-success-500"></Gamepad2>
		{:else}
			<Gamepad2 size="2.5rem" class="text-error-500"></Gamepad2>
		{/if}
	</div>
{/key}
