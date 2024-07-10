import { CONTROL_SOURCE_NAME, ROVER_SOURCE_NAME, type Core, type Disposable } from '$lib/core/core';
import { get } from 'svelte/store';
import { Topic } from './topic';
import { Service } from './service';
import type { HeartbeatConfig } from '$lib/core/configParser';

type Heartbeat = {
	source: string;
	id: number;
};

type InternalHeartbeat = {
	time: Date;
	timedOut: boolean;
};

export class HeartbeatManager implements Disposable {
	private readonly _connectService: Service<HeartbeatConfig, boolean>;
	private readonly _disconnect: Topic<void>;
	private readonly _topic: Topic<Heartbeat>;
	private readonly _core: Core;
	private _timeoutCount: number = 0;
	private _heartbeats: Map<number, InternalHeartbeat> = new Map();
	private _nextId: number = 0;
	private _checkIntervalId?: NodeJS.Timeout;
	private _sendIntervalId?: NodeJS.Timeout;

	constructor(core: Core) {
		this._core = core;
		this._connectService = new Service(
			core.ros,
			'/heartbeat_config',
			'core_interfaces/HeartbeatConfig'
		);
		this._disconnect = new Topic(core.ros, '/heartbeat_stop', 'std_msgs/Empty');
		this._topic = new Topic(core.ros, '/heartbeat', 'core_interfaces/Heartbeat');
		this._timeoutCount = 0;

		this._topic.subscribe().subscribe((heartbeat) => {
			if (heartbeat && heartbeat.source == ROVER_SOURCE_NAME) {
				this.onHeartbeat(heartbeat);
			}
		});
	}

	async sendConfig() {
		const response = await this._connectService.call(this._core.config.heartbeat, true);

		if (response) {
			this._checkIntervalId = setInterval(
				() => this.checkHearbeats(),
				this._core.config.heartbeat.heartbeatCheckInterval
			);

			this._sendIntervalId = setInterval(
				() => this.sendHeartbeat(),
				this._core.config.heartbeat.heartbeatInterval
			);

			return;
		}

		throw new Error(
			'The rover did not accept our heartbeat configuration. \
			There is probably another instance of this that is active or did not cleanly shut down.'
		);
	}

	sendHeartbeat() {
		this._heartbeats.set(this._nextId, {
			time: new Date(),
			timedOut: false
		});

		this._topic.publish({
			source: CONTROL_SOURCE_NAME,
			id: this._nextId
		});

		if (this._core.config.fakeConnect) {
			this.onHeartbeat({
				source: ROVER_SOURCE_NAME,
				id: this._nextId
			});
		}

		this._nextId++;
	}

	onHeartbeat(heartbeat: Heartbeat) {
		const now = new Date();
		const sent = this._heartbeats.get(heartbeat.id);

		if (!sent) {
			console.error('Received heartbeat with unknown id:', heartbeat.id);
			return;
		}

		const latency = now.getTime() - sent.time.getTime();
		this._heartbeats.delete(heartbeat.id);
		this._timeoutCount = 0;

		this._core.state.update((s) => ({ ...s, latency, connection: 'connected' }));
	}

	checkHearbeats() {
		if (get(this._core.state).connection != 'connected') {
			return;
		}

		const now = new Date();
		const timeout = this._core.config.heartbeat.heartbeatTimeout;

		for (const [, heartbeat] of this._heartbeats) {
			if (now.getTime() - heartbeat.time.getTime() > timeout && !heartbeat.timedOut) {
				if (this._timeoutCount == 0) {
					this._core.sendToast('warning', 'A heartbeat timed out.');
				}

				this._timeoutCount++;
				heartbeat.timedOut = true;
			}
		}

		if (this._timeoutCount >= this._core.config.heartbeat.heartbeatTimeoutLimit) {
			this._core.state.update((s) => ({ ...s, connection: 'disconnected' }));
			this._core.sendToast('error', 'Too many heartbeats timed out.');
		}
	}

	dispose(): void {
		this._disconnect.publish();

		clearInterval(this._checkIntervalId);
		clearInterval(this._sendIntervalId);
	}
}
