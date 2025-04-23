import JSON5 from 'json5';

export type HeartbeatConfig = {
	heartbeatInterval: number;
	heartbeatCheckInterval: number;
	heartbeatTimeout: number;
	heartbeatTimeoutLimit: number;
};

export type Config = {
	roslibUrl: string;
	rtcSignalingUrl: string;
	fakeConnect: boolean;
	noHeartbeat: boolean;
	publishRate: number;
	heartbeat: HeartbeatConfig;
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
	static parseConfig(configCoreText: string, configMainText: string): Config {
		const rawCore = JSON5.parse(configCoreText);
		const rawMain = JSON5.parse(configMainText);

		// TODO: Validate the config file

		return {
			...rawCore,
			...rawMain
		} as unknown as Config;
	}
}
