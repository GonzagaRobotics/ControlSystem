import * as ROSLIB from 'roslib';
import { Ros } from './ros';
import { writable, type Readable, type Writable } from 'svelte/store';

export class Topic<T> {
	private _internal: ROSLIB.Topic | null = null;
	private readonly _lastSubMsg: Writable<T | undefined>;

	constructor(ros: Ros, name: string, messageType: string) {
		if (ros.internal) {
			this._internal = new ROSLIB.Topic({
				ros: ros.internal,
				name,
				messageType
			});
		}

		this._lastSubMsg = writable(undefined, (set) => {
			this._internal?.subscribe((message) => {
				set(Ros.toJsStyle(message));
			});

			return () => {
				this._internal?.unsubscribe();
			};
		});
	}

	subscribe(): Readable<T | undefined> {
		return { subscribe: this._lastSubMsg.subscribe };
	}

	publish(message: T) {
		this._internal?.publish(Ros.toRosStyle(message));
	}
}
