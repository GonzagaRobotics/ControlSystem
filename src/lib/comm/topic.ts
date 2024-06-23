import * as ROSLIB from 'roslib';
import type { Ros } from './ros';
import { writable, type Readable } from 'svelte/store';

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

	subscribe(): Readable<T | undefined> {
		const store = writable<T | undefined>(undefined);

		this.internal?.subscribe((message) => {
			store.set(message as T);
		});

		return store;
	}

	publish(message: T) {
		this.internal?.publish(new ROSLIB.Message(message));
	}
}
