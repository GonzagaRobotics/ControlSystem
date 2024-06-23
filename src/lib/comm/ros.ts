import type { Config } from '$lib/core/configParser';
import type { State } from '$lib/core/core';
import * as ROSLIB from 'roslib';
import type { Writable } from 'svelte/store';

export class Ros {
	readonly internal: ROSLIB.Ros | null = null;
	private readonly _state: Writable<State>;

	constructor(config: Config, state: Writable<State>) {
		this._state = state;

		if (config.fakeConnect) {
			state.update((s) => ({ ...s, connection: 'connected' }));
			return;
		}

		this.internal = new ROSLIB.Ros({
			url: 'ws://' + config.roslibUrl
		});

		this.internal.on('connection', () => {
			state.update((s) => ({ ...s, connection: 'connected' }));
		});

		this.internal.on('error', (error) => {
			console.error('ROSLIB error:', error);
		});

		this.internal.on('close', () => {
			state.update((s) => ({ ...s, connection: 'disconnected' }));
		});
	}

	disconnect() {
		if (this.internal) {
			this.internal.close();
		} else {
			this._state.update((s) => ({ ...s, connection: 'disconnected' }));
		}
	}
}
