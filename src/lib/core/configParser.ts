import JSON5 from 'json5';

export type Config = {
	roslibUrl: string;
	fakeConnect: boolean;
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
	}[];
};

export class ConfigParser {
	static parseConfig(configText: string): Config {
		const raw = JSON5.parse(configText);

		// TODO: Validate the config file

		return raw as Config;
	}
}
