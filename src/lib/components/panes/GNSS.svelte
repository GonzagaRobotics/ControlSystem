<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { Topic } from '$lib/comm/topic';
	import { Map, View } from 'ol';
	import { GeoTIFF, OSM } from 'ol/source';
	import TileLayer from 'ol/layer/Tile';
	import WebGLTileLayer from 'ol/layer/WebGLTile.js';
	import { useGeographic } from 'ol/proj';
	import proj4 from 'proj4';
	import { register } from 'ol/proj/proj4';
	import { MapPin } from '@lucide/svelte';

	type GNSS = {
		// lat, long, alt
		position: {
			x: number;
			y: number;
			z: number;
		};
		// pitch, roll, yaw
		rotation: {
			x: number;
			y: number;
			z: number;
		};
		magHeading: number;
	};

	let { start } = $props();

	const core = getContext<Core>('core');

	const gnssTopic = new Topic<GNSS>(core.ros, 'gnss', 'gnss_interfaces/GNSS');
	const gnss = gnssTopic.subscribe();

	// Define the conversion between UTM 12N and WGS84
	proj4.defs(
		'EPSG:26912',
		'+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
	);

	register(proj4);

	// Needed for OpenLayers to work with lat/lon coordinates
	useGeographic();

	const source = new GeoTIFF({
		sources: [
			{
				url: '/urc.tif'
			}
		]
	});

	const layer = new WebGLTileLayer({ source });

	const map = new Map({
		layers: [layer],
		view: source.getView()
	});

	onMount(() => {
		map.setTarget('gnss-map');
	});
</script>

{#snippet dataText(text: string)}
	<p class="text-center font-mono">{text}</p>
{/snippet}

<Pane
	name="GNSS"
	{start}
	size={{ x: 1, y: 1 }}
	containerClasses="flex flex-col"
	loading={!core.config.fakeConnect && !$gnss}
>
	<div class="grid grid-cols-3 grid-rows-2">
		{@render dataText(`Lat: ${$gnss?.position.x ?? 'XX.XXXXXX'}`)}
		{@render dataText(`Lon: ${$gnss?.position.y ?? 'XX.XXXXX'}`)}
		{@render dataText(`Alt: ${$gnss?.position.z ?? 'XXXX.XX'}`)}
		{@render dataText(`Pitch: ${$gnss?.rotation.x ?? 'XX.XX'}`)}
		{@render dataText(`Roll: ${$gnss?.rotation.y ?? 'XX.XX'}`)}
		{@render dataText(`Mag: ${$gnss?.magHeading ?? 'XXX.XX'}`)}
	</div>

	<div id="gnss-map" class="grow"></div>
</Pane>
