import * as ROSLIB from 'roslib';
import type { Ros } from './ros';
import { writable, type Readable, type Writable } from 'svelte/store';
import type { Disposable } from '$lib/core/core';

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

export class Topic<T> implements Disposable {
	private _internal: ROSLIB.Topic | null = null;
	private readonly _lastSubMsg: Writable<T | undefined>;

	constructor(ros: Ros, topicName: string, messageType: string, transform = standardTransform) {
		if (ros.internal) {
			this._internal = new ROSLIB.Topic({
				ros: ros.internal,
				name: topicName,
				messageType: messageType
			});
		}

		this._lastSubMsg = writable(undefined, (set) => {
			this._internal?.subscribe((message) => {
				set(transform(message));
			});

			return () => {
				console.log('Unsubscribing from topic...');

				this._internal?.unsubscribe();
			};
		});
	}

	subscribe(): Readable<T | undefined> {
		return { subscribe: this._lastSubMsg.subscribe };
	}

	publish(message: T) {
		this._internal?.publish(new ROSLIB.Message(message));
	}

	dispose() {
		this._internal = null;
	}
}
