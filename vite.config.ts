import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, ModuleNode, type PluginOption } from 'vite';

const fullReloadAlways: PluginOption = {
	name: 'full-reload',
	handleHotUpdate({ server, modules, timestamp }) {
		const invalidatedModules = new Set<ModuleNode>();

		for (const mod of modules) {
			server.moduleGraph.invalidateModule(mod, invalidatedModules, timestamp, true);
		}

		server.ws.send({ type: 'full-reload' });

		return [];
	}
};

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), fullReloadAlways],
	test: {
		workspace: [
			{
				extends: './vite.config.ts',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
