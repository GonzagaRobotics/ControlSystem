import { type Core, type Disposable } from '$lib/core/core.svelte';
import { Topic } from './topic';
import { Service } from './service';
import type { HeartbeatConfig } from '$lib/core/configParser';
import { SvelteDate } from 'svelte/reactivity';

export class HeartbeatManager implements Disposable {
	private readonly _connectService: Service<HeartbeatConfig, { accepted: boolean }>;
	private readonly _disconnect: Topic<void>;
	private readonly _inTopic: Topic<{ id: number }>;
	private readonly _outTopic: Topic<{ id: number }>;
	private readonly _core: Core;
	private nextId: number = 0;
	private _sentHeartbeats: { id: number; sent: SvelteDate }[] = [];
	private _lastHeartbeatTime: SvelteDate | undefined;
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

		this._inTopic.subscribe().subscribe((heartbeat) => {
			if (heartbeat) {
				this.onHeartbeat(heartbeat.id);
			}
		});
	}

	async sendConfig() {
		const response = await this._connectService.call(this._core.config.heartbeat, {
			accepted: true
		});

		if (response.accepted) {
			this._checkIntervalId = setInterval(
				() => this.checkHearbeats(),
				this._core.config.heartbeat.heartbeatCheckInterval
			);

			this._sendIntervalId = setInterval(
				() => this.sendHeartbeat(),
				this._core.config.heartbeat.heartbeatInterval
			);
		}

		return response.accepted;
	}

	sendHeartbeat() {
		this._outTopic.publish({ id: this.nextId });
		this._sentHeartbeats.push({ id: this.nextId, sent: new SvelteDate() });

		if (this._core.config.fakeConnect) {
			this.onHeartbeat(this.nextId);
		}

		this.nextId++;
	}

	onHeartbeat(id: number) {
		const now = new SvelteDate();
		const sent = this._sentHeartbeats.find((v) => v.id == id)?.sent;
		this._lastHeartbeatTime = now;

		if (!sent) {
			console.warn(`Got a heartbeat with id ${id}, which we have no record of sending recently.`);
		}

		const latency = now.getTime() - (sent ?? now).getTime();
		this._timeoutCount = 0;

		this._core.state.latency = latency;
		this._core.state.connection = 'connected';
	}

	checkHearbeats() {
		if (this._core.state.connection != 'connected' || !this._lastHeartbeatTime) {
			return;
		}

		const now = new SvelteDate();
		const interval = this._core.config.heartbeat.heartbeatInterval;
		const timeout = this._core.config.heartbeat.heartbeatTimeout;
		const expectedHeartbeatTime = new SvelteDate(
			this._lastHeartbeatTime.getTime() + interval * (this._timeoutCount + 1)
		);

		if (now.getTime() - expectedHeartbeatTime.getTime() > timeout) {
			if (this._timeoutCount == 0) {
				this._core.sendToast('warning', 'A heartbeat timed out.');
			}

			this._timeoutCount++;
		}

		if (this._timeoutCount >= this._core.config.heartbeat.heartbeatTimeoutLimit) {
			this._core.state.connection = 'disconnected';
			this._core.sendToast('error', 'Too many heartbeats timed out.');
		}
	}

	dispose(): void {
		this._disconnect.publish();

		clearInterval(this._checkIntervalId);
		clearInterval(this._sendIntervalId);
	}
}
