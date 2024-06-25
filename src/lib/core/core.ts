import { writable, type Readable, type Writable } from 'svelte/store';
import { type Config } from './configParser';
import { Ros } from '$lib/comm/ros';

/**
 * An object that can be disposed of when it is no longer needed.
 */
export interface Disposable {
	/**
	 * Disposes of the object, releasing any resources it holds.
	 * This method should be idempotent, but the caller should not use the
	 * object after calling this method.
	 */
	dispose(): void;
}

export type State = {
	connection: 'disconnected' | 'connecting' | 'connected';
	latency?: number;
};

export class Core implements Disposable {
	readonly config: Config;
	readonly ros: Ros;
	private readonly _state: Writable<State>;

	constructor(config: Config) {
		this.config = config;
		this._state = writable({ connection: 'disconnected' });
		this.ros = new Ros(this.config, this._state);
	}

	get state(): Readable<State> {
		return this._state;
	}

	dispose() {
		console.log('Disposing Core...');

		this.ros.dispose();
	}
}
