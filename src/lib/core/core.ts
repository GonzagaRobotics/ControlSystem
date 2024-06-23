import { writable, type Readable, type Writable } from 'svelte/store';
import { type Config } from './configParser';
import { Ros } from '$lib/comm/ros';

export type State = {
	connection: 'disconnected' | 'connecting' | 'connected';
	latency?: number;
};

export class Core {
	readonly config: Config;
	readonly ros: Ros;
	private readonly _state: Writable<State>;

	constructor(config: Config) {
		this.config = config;
		this._state = writable({ connection: 'disconnected' });
		this.ros = new Ros(this.config, this._state);
	}

	public get state(): Readable<State> {
		return this._state;
	}
}
