import type { Ros } from '$lib/comm/ros.svelte';
import { Topic } from '$lib/comm/topic';
import type { Readable } from 'svelte/store';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { fromLonLat } from 'ol/proj';
import { Feature, Map } from 'ol';
import { GeoTIFF } from 'ol/source';
import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Point } from 'ol/geom';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

export type GNSSData = {
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

const gnssFake: GNSSData = {
	position: {
		x: 38.406424,
		y: -110.791043,
		z: 1500
	},
	rotation: {
		x: 0,
		y: 0,
		z: 0
	},
	magHeading: 0
};

// Define the conversion between UTM 12N and WGS84
proj4.defs(
	'EPSG:26912',
	'+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);

register(proj4);

export class GNSS {
	private readonly _topic: Topic<GNSSData>;
	private readonly _infoSource: VectorSource;
	private readonly _posPoint: Point;
	private readonly _map: Map;

	constructor(ros: Ros) {
		this._topic = new Topic<GNSSData>(ros, 'gnss', 'gnss_interfaces/GNSS', gnssFake);

		const groundSource = new GeoTIFF({
			sources: [
				{
					url: '/urc.tif'
				}
			]
		});

		this._infoSource = new VectorSource();

		this._posPoint = new Point(
			fromLonLat([gnssFake.position.y, gnssFake.position.x], 'EPSG:26912')
		);

		const posFeature = new Feature(this._posPoint);
		this._infoSource.addFeature(posFeature);

		const baseLayer = new WebGLTileLayer({ source: groundSource });
		const infoLayer = new VectorLayer({ source: this._infoSource });

		const infoStyle = new Style({
			image: new Icon({ src: '/navigation-2.svg', rotateWithView: true })
		});

		infoLayer.setStyle(infoStyle);

		this._map = new Map({
			layers: [baseLayer, infoLayer],
			view: groundSource.getView()
		});

		this._topic.subscribe().subscribe((data) => {
			if (!data) {
				return;
			}

			this._posPoint.setCoordinates(fromLonLat([data.position.y, data.position.x], 'EPSG:26912'));
			infoStyle.getImage()!.setRotation((Math.PI / 180) * data.magHeading);
		});
	}

	setTarget(name: string): void {
		this._map.setTarget(name);
	}

	public get data(): Readable<GNSSData | undefined> {
		return this._topic.subscribe();
	}
}
