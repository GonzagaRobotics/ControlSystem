import type { Core, Disposable } from '$lib/core/core.svelte';
import { writable, type Writable } from 'svelte/store';
import { Topic } from './topic';

export class IntervalPublisher implements Disposable {
	private readonly _core: Core;
	private readonly _sending: Map<string, unknown>;
	private readonly _stores: Map<string, Writable<unknown>>;
	private readonly _topics: Map<string, Topic<unknown>>;
	private readonly _publishIntervalId: NodeJS.Timeout;

	constructor(core: Core) {
		this._core = core;
		this._sending = new Map();
		this._stores = new Map();
		this._topics = new Map();

		this._publishIntervalId = setInterval(
			() => this.publishMessages(),
			1000 / this._core.config.publishRate
		);
	}

	getStore<T>(name: string, type: string): Writable<T> {
		const current = this._stores.get(name);

		if (current) {
			const topic = this._topics.get(name)!;

			if (topic.messageType != type) {
				throw new Error(
					`Passed message type ${type} does not match existing type ${topic.messageType} on ${name}`
				);
			}

			return current as Writable<T>;
		}

		const store = writable<T>();

		store.subscribe((value) => {
			this._sending.set(name, value);
		});

		this._stores.set(name, store);
		this._topics.set(name, new Topic(this._core.ros, name, type));

		return store;
	}

	publishMessages() {
		this._sending.forEach((value, key) => {
			const topic = this._topics.get(key)!;

			topic.publish(value);
			console.log(`Published to ${key} with value ${value}`);
		});

		this._sending.clear();
	}

	dispose(): void {
		clearInterval(this._publishIntervalId);
	}
}
