import { writable, type Readable, type Writable } from 'svelte/store';
import { type Config } from './configParser';
import { Ros } from '$lib/comm/ros';
import { InputSystem } from '$lib/input/inputSystem';
import type { ToastStore } from '@skeletonlabs/skeleton';

/**
 * An object that can be disposed of when it is no longer needed.
 */
export interface Disposable {
	/**
	 * Disposes of the object, releasing any resources it holds.
	 * This method should be idempotent, but the caller should not use the
	 * object after calling this method.
	 */
	dispose(): void;
}

/**
 * An object that needs to perform some action every display frame.
 * This is not intended to be used for actions that need to be performed
 * even when the application is not visible.
 */
export interface Tickable {
	/**
	 * Called once per frame.
	 * @param deltaTime The time in seconds since the last frame.
	 */
	tick(deltaTime: number): void;
}

export type State = {
	connection: 'disconnected' | 'connecting' | 'connected';
	latency?: number;
};

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export class Core implements Disposable, Tickable {
	readonly config: Config;
	readonly ros: Ros;
	readonly input: InputSystem;
	private readonly _state: Writable<State>;
	private readonly _toastStore: ToastStore;

	constructor(config: Config, toastStore: ToastStore) {
		this.config = config;
		this._toastStore = toastStore;
		this.input = new InputSystem();
		this._state = writable({ connection: 'disconnected' });
		this.ros = new Ros(this.config, this, this._state);
	}

	get state(): Readable<State> {
		return this._state;
	}

	sendToast(type: ToastType, message: string) {
		function calculateDuration(type: ToastType) {
			switch (type) {
				case 'info':
					return 2000;
				case 'success':
					return 2500;
				case 'warning':
					return 3000;
				case 'error':
					return undefined;
			}
		}

		this._toastStore.trigger({
			message,
			timeout: calculateDuration(type),
			classes: `variant-filled-${type === 'info' ? 'secondary' : type}`,
			hideDismiss: type != 'error',
			autohide: type != 'error'
		});
	}

	tick(deltaTime: number): void {
		this.input.tick(deltaTime);
	}

	dispose() {
		this.ros.dispose();

		console.log('Core disposed');
	}
}
