import { ConfigParser } from '$lib/core/configParser';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const configFile = await fetch('/config.json5');

	if (!configFile.ok) {
		error(404, 'Failed to load config file: ' + configFile.statusText);
	}

	try {
		return {
			config: ConfigParser.parseConfig(await configFile.text())
		};
	} catch (e) {
		error(500, 'Failed to parse config file: ' + e);
	}
};
