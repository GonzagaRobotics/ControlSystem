import * as ROSLIB from 'roslib';
import type { Ros } from './ros';
import { writable, type Readable } from 'svelte/store';

/**
 * Recursively transforms a ROS message into a standard object.
 * Most of the work is already done by roslib, but importantly, the names
 * of the fields are kept in snake_case. So this function converts them to
 * camelCase.
 *
 * @param message The ROS message to transform.
 */
export function standardTransform<T>(message: ROSLIB.Message): T {
	const result: Record<string, unknown> = {};

	// Cast the message to any so we can iterate over its keys
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const anyMessage = message as any;

	for (const key in message) {
		// If the key has uppercase letters, it's a constant and doesn't need to be transformed
		if (key !== key.toLowerCase()) {
			result[key] = anyMessage[key];
			continue;
		}

		// If the key is an array, transform each element
		if (Array.isArray(anyMessage[key])) {
			result[key] = anyMessage[key].map((element: ROSLIB.Message) => standardTransform(element));
			continue;
		}

		// If the key is an object, transform it recursively
		if (typeof anyMessage[key] === 'object') {
			result[key] = standardTransform(anyMessage[key]);
			continue;
		}

		// Now we know the key is a simple value, we can change its name
		const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
		result[camelKey] = anyMessage[key];
	}

	return result as T;
}

export class Topic<T> {
	readonly internal: ROSLIB.Topic | null = null;

	constructor(ros: Ros, topicName: string, messageType: string) {
		if (ros.internal === null) {
			return;
		}

		this.internal = new ROSLIB.Topic({
			ros: ros.internal,
			name: topicName,
			messageType: messageType
		});
	}

	subscribe(transform: (raw: ROSLIB.Message) => T = standardTransform): Readable<T | undefined> {
		const store = writable<T | undefined>(undefined);

		this.internal?.subscribe((message) => {
			store.set(transform(message));
		});

		return store;
	}

	publish(message: T) {
		this.internal?.publish(new ROSLIB.Message(message));
	}
}
