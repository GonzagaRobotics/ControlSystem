import JSON5 from 'json5';

export type HeartbeatConfig = {
	heartbeatInterval: number;
	heartbeatCheckInterval: number;
	heartbeatTimeout: number;
	heartbeatTimeoutLimit: number;
};

export type Config = {
	roslibUrl: string;
	fakeConnect: boolean;
	heartbeat: HeartbeatConfig;
	publishRate: number;
	panes: {
		id: string;
		name: string;
	}[];
	tabs: {
		id: string;
		name: string;
		panes: {
			id: string;
			position: { x: number; y: number };
			size: { x: number; y: number };
		}[];
		attributes: string[];
	}[];
};

export class ConfigParser {
	static parseConfig(configText: string): Config {
		const raw = JSON5.parse(configText);

		// TODO: Validate the config file

		return raw as Config;
	}
}
