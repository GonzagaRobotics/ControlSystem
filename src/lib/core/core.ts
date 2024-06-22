import { writable, type Readable, type Writable } from 'svelte/store';
import { ConfigParser, type Config } from './configParser';

export type State = {
	connection: 'disconnected' | 'connecting' | 'connected';
	latency?: number;
};

export class Core {
	private readonly _config: Writable<Config | null>;
	private readonly _state: Writable<State>;

	constructor() {
		this._config = writable(null);
		this._state = writable({ connection: 'disconnected' });
	}

	async init() {
		this._config.set(await ConfigParser.parseConfig());
	}

	public get config(): Readable<Config | null> {
		return this._config;
	}

	public get state(): Readable<State> {
		return this._state;
	}
}
