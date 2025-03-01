import { type Core, type Disposable } from '$lib/core/core';
import { get } from 'svelte/store';
import { Topic } from './topic';
import { Service } from './service';
import type { HeartbeatConfig } from '$lib/core/configParser';

export class HeartbeatManager implements Disposable {
	private readonly _connectService: Service<HeartbeatConfig, { ready: boolean }>;
	private readonly _disconnect: Topic<void>;
	private readonly _inTopic: Topic<void>;
	private readonly _outTopic: Topic<void>;
	private readonly _core: Core;
	private _lastHeartbeatTime: Date | undefined;
	private _timeoutCount: number = 0;
	private _checkIntervalId?: NodeJS.Timeout;
	private _sendIntervalId?: NodeJS.Timeout;

	constructor(core: Core) {
		this._core = core;
		this._connectService = new Service(
			core.ros,
			'/heartbeat/connect',
			'core_interfaces/HeartbeatConnect'
		);
		this._disconnect = new Topic(
			core.ros,
			'/heartbeat/disconnect',
			'core_interfaces/HeartbeatDisconnect'
		);
		this._inTopic = new Topic(core.ros, '/heartbeat/control', 'core_interfaces/Heartbeat');
		this._outTopic = new Topic(core.ros, '/heartbeat/rover', 'core_interfaces/Heartbeat');
		this._timeoutCount = 0;

		this._inTopic.subscribe().subscribe((heartbeat) => {
			if (heartbeat) {
				this.onHeartbeat();
			}
		});
	}

	async sendConfig() {
		const response = await this._connectService.call(this._core.config.heartbeat, { ready: true });

		if (response.ready) {
			this._checkIntervalId = setInterval(
				() => this.checkHearbeats(),
				this._core.config.heartbeat.heartbeatCheckInterval
			);

			this._sendIntervalId = setInterval(
				() => this.sendHeartbeat(),
				this._core.config.heartbeat.heartbeatInterval
			);
		}

		return response.ready;
	}

	sendHeartbeat() {
		this._outTopic.publish();
		this._lastHeartbeatTime = new Date();

		if (this._core.config.fakeConnect) {
			this.onHeartbeat();
		}
	}

	onHeartbeat() {
		const now = new Date();
		const sent = this._lastHeartbeatTime || now;

		const latency = now.getTime() - sent.getTime();
		this._timeoutCount = 0;

		this._core.state.update((s) => ({ ...s, latency, connection: 'connected' }));
	}

	checkHearbeats() {
		if (get(this._core.state).connection != 'connected' || this._lastHeartbeatTime == undefined) {
			return;
		}

		const now = new Date();
		const interval = this._core.config.heartbeat.heartbeatInterval;
		const timeout = this._core.config.heartbeat.heartbeatTimeout;
		const expectedHeartbeatTime = new Date(
			this._lastHeartbeatTime.getTime() + interval * (this._timeoutCount + 1)
		);

		if (now.getTime() - expectedHeartbeatTime.getTime() > timeout) {
			if (this._timeoutCount == 0) {
				this._core.sendToast('warning', 'A heartbeat timed out.');
			}

			this._timeoutCount++;
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
