import * as ROSLIB from 'roslib';
import { Ros } from './ros';

export class Service<T, R> {
	private _interal: ROSLIB.Service | null = null;

	constructor(ros: Ros, name: string, serviceType: string) {
		if (ros.internal) {
			this._interal = new ROSLIB.Service({
				ros: ros.internal,
				name,
				serviceType
			});
		}
	}

	async call(request: T, fakeResponse?: R): Promise<R> {
		if (this._interal == null) {
			if (fakeResponse) {
				return fakeResponse;
			}

			throw new Error('Cannot fake a service call without a fake response');
		}

		return new Promise((resolve, reject) => {
			this._interal?.callService(
				Ros.toRosStyle(request),
				(result) => {
					resolve(Ros.toJsStyle(result));
				},
				(error) => {
					reject(error);
				}
			);
		});
	}
}
