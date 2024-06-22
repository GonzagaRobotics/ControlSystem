import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig, type Plugin } from 'vite';

const fullReloadAlways: Plugin = {
	name: 'full-reload',
	handleHotUpdate({ server }) {
		server.ws.send({ type: 'full-reload' });
		return [];
	}
};

export default defineConfig({
	plugins: [
		sveltekit(),
		purgeCss(),
		Icons({
			compiler: 'svelte'
		}),
		fullReloadAlways
	]
});
