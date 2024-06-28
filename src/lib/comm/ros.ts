/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Config } from '$lib/core/configParser';
import type { Core, State } from '$lib/core/core';
import * as ROSLIB from 'roslib';
import type { Writable } from 'svelte/store';

export class Ros {
	readonly internal: ROSLIB.Ros | null = null;

	constructor(config: Config, core: Core, state: Writable<State>) {
		if (config.fakeConnect) {
			state.update((s) => ({ ...s, connection: 'connected' }));
			core.sendToast('success', 'Fake connected to ROS');
			return;
		}

		this.internal = new ROSLIB.Ros({
			url: 'ws://' + config.roslibUrl
		});

		this.internal.on('connection', () => {
			state.update((s) => ({ ...s, connection: 'connected' }));
			core.sendToast('success', 'Connected to ROS');
		});

		this.internal.on('error', (error) => {
			core.sendToast('error', 'ROSLIB error, see console');
			console.error('ROSLIB error:', error);
		});

		this.internal.on('close', () => {
			state.update((s) => ({ ...s, connection: 'disconnected' }));
			core.sendToast('warning', 'Disconnected from ROS');
		});
	}

	static toRosStyle(obj: any): any {
		const result: any = {};

		for (const key in obj) {
			// If the key is for an array, transform each element
			if (Array.isArray(obj[key])) {
				result[key] = obj[key].map((element: any) => Ros.toRosStyle(element));
				continue;
			}

			// If the key is an object, transform it recursively
			if (typeof obj[key] === 'object') {
				result[key] = Ros.toRosStyle(obj[key]);
				continue;
			}

			// Now we know the key is a simple value, we can change its name
			const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
			result[snakeKey] = obj[key];
		}

		return result;
	}

	static toJsStyle(obj: any): any {
		const result: any = {};

		for (const key in obj) {
			// If the key is for an array, transform each element
			if (Array.isArray(obj[key])) {
				result[key] = obj[key].map((element: any) => Ros.toJsStyle(element));
				continue;
			}

			// If the key is an object, transform it recursively
			if (typeof obj[key] === 'object') {
				result[key] = Ros.toJsStyle(obj[key]);
				continue;
			}

			// Now we know the key is a simple value, we can change its name
			const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
			result[camelKey] = obj[key];
		}

		return result;
	}
}
