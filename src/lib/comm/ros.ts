/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Core } from '$lib/core/core';
import * as ROSLIB from 'roslib';

export class Ros {
	readonly internal: ROSLIB.Ros | null = null;

	constructor(core: Core) {
		if (core.config.fakeConnect) {
			core.state.update((s) => ({ ...s, connection: 'roslibConnected' }));
			return;
		}

		this.internal = new ROSLIB.Ros({
			url: 'ws://' + core.config.roslibUrl
		});
        
        console.log(core.config.roslibUrl);

		this.internal.on('connection', () => {
			console.log('Connected to roslib');

			core.state.update((s) => ({ ...s, connection: 'roslibConnected' }));
		});

		this.internal.on('error', (error) => {
			core.state.update((s) => ({ ...s, connection: 'failed' }));
			core.sendToast('error', 'ROSLIB error, see console');
			console.error('ROSLIB error:', error);
		});

		this.internal.on('close', () => {
			console.log('Roslib connection closed');

			core.state.update((s) => {
				if (s.connection == 'failed') {
					return s;
				}

				return { ...s, connection: 'disconnected' };
			});
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
