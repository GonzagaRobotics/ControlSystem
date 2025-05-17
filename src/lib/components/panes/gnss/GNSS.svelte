<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { GNSS } from './gnss';

	let { start } = $props();

	function dataToString(latLon: boolean, data: number | undefined) {
		if (data == undefined) {
			if (latLon) {
				return 'XX.XXXXXX';
			} else {
				return 'XXX.XX';
			}
		}

		if (latLon) {
			return data.toFixed(6);
		} else {
			return data.toFixed(2);
		}
	}

	const core = getContext<Core>('core');

	const gnss = new GNSS(core.ros);
	const gnssData = gnss.data;

	onMount(() => {
		gnss.setTarget('gnss-map');
	});
</script>

{#snippet dataText(text: string, latLon: boolean, data?: number)}
	<p class="text-center font-mono">{text}: {dataToString(latLon, data)}</p>
{/snippet}

<Pane
	name="GNSS"
	{start}
	size={{ x: 1, y: 1 }}
	containerClasses="flex flex-col"
	loading={!core.config.fakeConnect && !$gnssData}
>
	<div class="grid grid-cols-3 grid-rows-2">
		{@render dataText('Lat', true, $gnssData?.position.x)}
		{@render dataText('Lon', true, $gnssData?.position.y)}
		{@render dataText('Alt', false, $gnssData?.position.z)}
		{@render dataText('Pitch', false, $gnssData?.rotation.x)}
		{@render dataText('Roll', false, $gnssData?.rotation.y)}
		{@render dataText('Mag', false, $gnssData?.magHeading)}
	</div>

	<div id="gnss-map" class="grow"></div>
</Pane>
