import type { Ros } from '$lib/comm/ros.svelte';
import { Topic } from '$lib/comm/topic';
import { derived, type Readable } from 'svelte/store';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { fromLonLat } from 'ol/proj';
import { Feature, Map } from 'ol';
import { GeoTIFF } from 'ol/source';
import WebGLTileLayer from 'ol/layer/WebGLTile.js';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { LineString, Point } from 'ol/geom';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import type { ImuMsg, NavSatFix, Vector3Msg } from '$lib/comm/interfaces';
import { quatToEuler } from '$lib/core/math';
import { Stroke } from 'ol/style';
import type { Core } from '$lib/core/core.svelte';

const fixFake: NavSatFix = {
	header: {
		stamp: {
			sec: 0,
			nanosec: 0
		},
		frame_id: ''
	},
	status: {
		status: 0,
		service: 1
	},
	latitude: 38.406424,
	longitude: -110.791043,
	altitude: 1500,
	position_covariance: [6, 0, 0, 6, 0, 0, 6, 0, 0],
	position_covariance_type: 1
};

const imuFake: ImuMsg = {
	header: {
		stamp: {
			sec: 0,
			nanosec: 0
		},
		frame_id: ''
	},
	orientation: {
		x: 0,
		y: 0,
		z: 0,
		w: 1
	},
	orientation_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
	angular_velocity: {
		x: 0,
		y: 0,
		z: 0
	},
	angular_velocity_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0],
	linear_acceleration: {
		x: 0,
		y: 0,
		z: 0
	},
	linear_acceleration_covariance: [0, 0, 0, 0, 0, 0, 0, 0, 0]
};

// Define the conversion between UTM 12N and WGS84
proj4.defs(
	'EPSG:26912',
	'+proj=utm +zone=12 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
);

register(proj4);

export class GNSS {
	private readonly _fixTopic: Topic<NavSatFix>;
	// TODO: Calibration topic
	private readonly _imuTopic: Topic<ImuMsg>;
	private readonly _infoSource: VectorSource;
	private readonly _planSource: VectorSource;
	private readonly _posPoint: Point;
	private readonly _map: Map;

	constructor(core: Core) {
		this._fixTopic = new Topic<NavSatFix>(core.ros, 'fix', 'sensor_msgs/NavSatFix', fixFake);
		this._imuTopic = new Topic<ImuMsg>(core.ros, 'imu', 'sensor_msgs/Imu', imuFake);

		const groundSource = new GeoTIFF({
			sources: [
				{
					url: '/urc.tif'
				}
			]
		});

		this._infoSource = new VectorSource();

		this._posPoint = new Point(fromLonLat([fixFake.longitude, fixFake.latitude], 'EPSG:26912'));

		const posFeature = new Feature(this._posPoint);
		this._infoSource.addFeature(posFeature);

		this._planSource = new VectorSource();

		const baseLayer = new WebGLTileLayer({ source: groundSource });
		const infoLayer = new VectorLayer({ source: this._infoSource });
		const planLayer = new VectorLayer({ source: this._planSource });

		const infoStyle = new Style({
			image: new Icon({ src: '/navigation-2.svg', rotateWithView: true })
		});

		infoLayer.setStyle(infoStyle);

		const planStyle = new Style({
			stroke: new Stroke({ color: 'blue', width: 2 })
		});

		planLayer.setStyle(planStyle);

		this._map = new Map({
			layers: [baseLayer, infoLayer, planLayer],
			view: groundSource.getView()
		});

		this._fixTopic.subscribe().subscribe((data) => {
			if (!data || data.status.status < 0) {
				return;
			}

			this._posPoint.setCoordinates(fromLonLat([data.longitude, data.latitude], 'EPSG:26912'));
		});

		this._imuTopic.subscribe().subscribe((data) => {
			if (!data) {
				return;
			}

			const rpy = quatToEuler(data.orientation);

			infoStyle.getImage()!.setRotation((Math.PI / 180) * rpy.z);
		});

		core.ipcBus.subscribe((msg) => {
			if (msg?.type !== 'auto_plan') {
				return;
			}

			this._planSource.clear();

			const plan = msg.data as [number, number][];
			const coords = plan.map((wp) => fromLonLat([wp[1], wp[0]], 'EPSG:26912'));

			const planFeature = new Feature(new LineString(coords));
			this._planSource.addFeature(planFeature);
		});
	}

	setTarget(name: string): void {
		this._map.setTarget(name);
	}

	public get dataPos(): Readable<NavSatFix | undefined> {
		return this._fixTopic.subscribe();
	}

	public get dataOrient(): Readable<Vector3Msg | undefined> {
		return derived(this._imuTopic.subscribe(), (imu) => {
			if (!imu) {
				return undefined;
			}

			return quatToEuler(imu.orientation);
		});
	}
}
