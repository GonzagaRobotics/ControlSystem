<script lang="ts">
	import { Core } from '$lib/core/core.svelte';
	import { getContext } from 'svelte';
	import { paneList } from '$lib/components/panes/paneList';

	let { tabObj } = $props();

	const core = getContext<Core>('core');

	function getComponent(paneId: string) {
		if (!(paneId in paneList)) {
			return paneList.unknown;
		}

		return paneList[paneId as keyof typeof paneList];
	}
</script>

{#snippet centeredText(text: string)}
	<div class="col-span-4 row-span-2 flex items-center justify-center">
		<h1 class="h1 text-center">{text}</h1>
	</div>
{/snippet}

<div class="grid h-full grid-cols-4 grid-rows-2 gap-2">
	{#await core.init()}
		{@render centeredText('Connecting...')}``
	{:then accepted}
		{#if accepted}
			{#each tabObj()?.panes ?? [] as pane (pane.id)}
				{@const PaneComponent = getComponent(pane.id)}

				<PaneComponent id={pane.id} start={pane.position} size={pane.size} />
			{/each}
		{:else}
			{@render centeredText('The rover rejected the connection.')}
		{/if}
	{:catch error}
		{@render centeredText(error)}
	{/await}
</div>
