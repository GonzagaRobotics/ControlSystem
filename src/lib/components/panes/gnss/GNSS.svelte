<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { GNSS } from './gnss';

	let { start } = $props();

	function dataToString(isLatLon: boolean, data: number | undefined) {
		if (data == undefined) {
			if (isLatLon) {
				return 'XX.XXXXXX';
			} else {
				return 'XXX.XX';
			}
		}

		if (isLatLon) {
			return data.toFixed(6);
		} else {
			return data.toFixed(2);
		}
	}

	const core = getContext<Core>('core');

	const gnss = new GNSS(core.ros);
	const locData = gnss.dataPos;
	const orientData = gnss.dataOrient;

	let loading = $derived(!core.config.fakeConnect && !$locData && !$orientData);

	$effect(() => {
		if (!loading) {
			gnss.setTarget('gnss-map');
		}
	})
</script>

{#snippet dataText(text: string, latLon: boolean, data?: number)}
	<p class="text-center font-mono">{text}: {dataToString(latLon, data)}</p>
{/snippet}

<Pane
	name="GNSS"
	{start}
	size={{ x: 1, y: 1 }}
	containerClasses="flex flex-col"
	loading={loading}
>
	<div class="grid grid-cols-3 grid-rows-2">
		{@render dataText('Lat', true, $locData?.latitude)}
		{@render dataText('Lon', true, $locData?.longitude)}
		{@render dataText('Alt', false, $locData?.altitude)}
		{@render dataText('Pitch', false, $orientData?.z)}
		{@render dataText('Roll', false, $orientData?.y)}
		{@render dataText('Yaw', false, $orientData?.x)}
	</div>

	<div id="gnss-map" class="grow"></div>
</Pane>
