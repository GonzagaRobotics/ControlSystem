import type { Config } from '$lib/core/configParser';
import type { Core, Disposable, State } from '$lib/core/core';
import * as ROSLIB from 'roslib';
import type { Writable } from 'svelte/store';

export class Ros implements Disposable {
	readonly internal: ROSLIB.Ros | null = null;
	private readonly _state: Writable<State>;

	constructor(config: Config, core: Core, state: Writable<State>) {
		this._state = state;

		if (config.fakeConnect) {
			state.update((s) => ({ ...s, connection: 'connected' }));
			core.sendToast('success', 'Fake connected to ROS');
			return;
		}

		this.internal = new ROSLIB.Ros({
			url: 'ws://' + config.roslibUrl
		});

		this.internal.on('connection', () => {
			state.update((s) => ({ ...s, connection: 'connected' }));
			core.sendToast('success', 'Connected to ROS');
		});

		this.internal.on('error', (error) => {
			core.sendToast('error', 'ROSLIB error, see console');
			console.error('ROSLIB error:', error);
		});

		this.internal.on('close', () => {
			state.update((s) => ({ ...s, connection: 'disconnected' }));
			core.sendToast('warning', 'Disconnected from ROS');
		});
	}

	dispose() {
		console.log('Disposing ROS...');

		if (this.internal) {
			this.internal.close();
		} else {
			this._state.update((s) => ({ ...s, connection: 'disconnected' }));
		}
	}
}
