import { ConfigParser } from '$lib/core/configParser';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
	const configCoreFile = await fetch('/config_core.json5');
	const configMainFile = await fetch('/config_main.json5');

	if (!configCoreFile.ok) {
		error(404, 'Failed to load config core file: ' + configCoreFile.statusText);
	}

	if (!configMainFile.ok) {
		error(404, 'Failed to load config main file: ' + configMainFile.statusText);
	}

	try {
		const configCoreText = await configCoreFile.text();
		const configMainText = await configMainFile.text();

		return {
			config: ConfigParser.parseConfig(configCoreText, configMainText)
		};
	} catch (e) {
		error(500, 'Failed to parse config files: ' + e);
	}
};
