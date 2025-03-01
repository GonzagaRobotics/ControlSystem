import { get, writable, type Writable } from 'svelte/store';
import { type Config } from './configParser';
import { Ros } from '$lib/comm/ros';
import { InputSystem } from '$lib/input/inputSystem';
import type { ToastStore } from '@skeletonlabs/skeleton';
import { HeartbeatManager } from '$lib/comm/heartbeatManager';
import { IntervalPublisher } from '$lib/comm/intervalPublisher';

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

/**
 * Testing function that waits for a specified number of milliseconds.
 */
export async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

export type State = {
	connection: 'disconnected' | 'connecting' | 'roslibConnected' | 'connected' | 'failed';
	latency?: number;
};

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export const CONTROL_SOURCE_NAME = 'control';
export const ROVER_SOURCE_NAME = 'rover';

export class Core implements Disposable, Tickable {
	readonly config: Config;
	readonly state: Writable<State>;
	readonly ros: Ros;
	readonly input: InputSystem;
	readonly intervalPublisher: IntervalPublisher;
	private readonly _heartbeatManager: HeartbeatManager | null;
	private readonly _toastStore: ToastStore;

	constructor(config: Config, toastStore: ToastStore) {
		this.config = config;
		this._toastStore = toastStore;
		this.input = new InputSystem(this);
		this.state = writable({ connection: 'disconnected' });
		this.ros = new Ros(this);

		this._heartbeatManager = this.config.noHeartbeat ? null : new HeartbeatManager(this);

		this.intervalPublisher = new IntervalPublisher(this);
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

	async init() {
		// Wait for the roslib connection to be established
		if (get(this.state).connection != 'roslibConnected') {
			await new Promise<void>((resolve, reject) => {
				this.state.subscribe((s) => {
					if (s.connection == 'roslibConnected') {
						resolve();
					} else if (s.connection == 'failed') {
						reject('ROS connection failed');
					}
				});
			});
		}

		// Wait for the heartbeat manager to be ready
		if (this.config.noHeartbeat) {
			this.state.update((s) => ({ ...s, connection: 'connected' }));

			return true;
		}

		try {
			const res = await this._heartbeatManager!.sendConfig();

			if (res) {
				this.state.update((s) => ({ ...s, connection: 'connected' }));

				return true;
			}
		} catch (error) {
			this.state.update((s) => ({ ...s, connection: 'failed' }));
			throw error;
		}

		return false;
	}

	tick(deltaTime: number): void {
		this.input.tick(deltaTime);
	}

	dispose() {
		this._heartbeatManager?.dispose();
		this.intervalPublisher.dispose();
	}
}
