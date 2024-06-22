import JSON5 from 'json5';

export type Config = {
	fakeConnect: boolean;
	window: WindowConfig;
};

export type WindowConfig = {
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
	static async parseConfig(): Promise<Config> {
		const response = await fetch('config.json5');

		if (!response.ok) {
			throw new Error('Failed to fetch config file: ' + response.statusText);
		}

		const raw = await JSON5.parse(await response.text());

		// TODO: Validate the config file

		return raw as Config;
	}
}
