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

export type LocData = {
	latitude: number;
	longitude: number;
	altitude: number;
};

export type OrientData = {
	roll: number;
	pitch: number;
	yaw: number;
};

const locFake: LocData = {
	latitude: 38.406424,
	longitude: -110.791043,
	altitude: 1500
};

const orientFake: OrientData = {
	roll: 0.05,
	pitch: -0.01,
	yaw: 0.042
};

// Define the conversion between UTM 12N and WGS84
proj4.defs(
	'EPSG:26912',
	'+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);

register(proj4);

export class GNSS {
	// TODO: Calibration topic
	private readonly _locTopic: Topic<LocData>;
	private readonly _orientTopic: Topic<OrientData>;
	private readonly _infoSource: VectorSource;
	private readonly _posPoint: Point;
	private readonly _map: Map;

	constructor(ros: Ros) {
		this._locTopic = new Topic<LocData>(ros, 'nav/location', 'nav_interfaces/Location', locFake);
		this._orientTopic = new Topic<OrientData>(
			ros,
			'nav/orient',
			'nav_interfaces/Orientation',
			orientFake
		);

		const groundSource = new GeoTIFF({
			sources: [
				{
					url: '/urc.tif'
				}
			]
		});

		this._infoSource = new VectorSource();

		this._posPoint = new Point(fromLonLat([locFake.longitude, locFake.latitude], 'EPSG:26912'));

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

		this._locTopic.subscribe().subscribe((data) => {
			if (!data) {
				return;
			}

			this._posPoint.setCoordinates(fromLonLat([data.longitude, data.latitude], 'EPSG:26912'));
		});

		this._orientTopic.subscribe().subscribe((data) => {
			if (!data) {
				return;
			}

			infoStyle.getImage()!.setRotation((Math.PI / 180) * data.yaw);
		});
	}

	setTarget(name: string): void {
		this._map.setTarget(name);
	}

	public get dataPos(): Readable<LocData | undefined> {
		return this._locTopic.subscribe();
	}

	public get dataOrient(): Readable<OrientData | undefined> {
		return this._orientTopic.subscribe();
	}
}
