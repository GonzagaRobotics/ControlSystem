import type { StdMsg } from '$lib/comm/interfaces';
import { Topic } from '$lib/comm/topic';
import { Core } from '$lib/core/core.svelte';
import type { Unsubscriber } from 'svelte/store';

export class RTC {
	private _pc: RTCPeerConnection;

	// Signaling from the source to us
	private _signalSrcTopic: Topic<StdMsg<string>>;
	// Signaling from us to the source
	private _signalSinkTopic: Topic<StdMsg<string>>;
	private _unsub: Unsubscriber;

	public get pc(): RTCPeerConnection {
		return this._pc;
	}

	constructor(core: Core) {
		this._signalSrcTopic = new Topic(core.ros, "/webrtc/signal_src", "std_msgs/String");
		this._signalSinkTopic = new Topic(core.ros, "/webrtc/signal_sink", "std_msgs/String");

		this._pc = new RTCPeerConnection();
		this.setupLogListeners();
		this._unsub = this._signalSrcTopic.subscribe().subscribe(this.onMessage);
	}

	connect() {
		this._signalSinkTopic.publish({ data: "{ \"type\": \"connect\" }" });
	}

	close() {
		this._unsub();
		this._pc.close();
	}

	reset() {
		this.close();

		this._pc = new RTCPeerConnection();
		this.setupLogListeners();
		this._unsub = this._signalSrcTopic.subscribe().subscribe(this.onMessage);
	}

	private async onMessage(message?: StdMsg<string>) {
		if (message == undefined) {
			return;
		}

		const data = JSON.parse(message.data)

		if (data.type == "offer") {
			console.log("|Camera| Got offer");

			await this._pc.setRemoteDescription(data);
			await this._pc.setLocalDescription();
			this._signalSinkTopic.publish({ data: JSON.stringify(this._pc.localDescription) });
		}
	}

	private setupLogListeners() {
		this._pc.onsignalingstatechange = () => {
			console.log(`|Camera| Signaling state: ${this._pc.signalingState}`);
		};

		this._pc.oniceconnectionstatechange = () => {
			console.log(`|Camera| ICE connection state: ${this._pc.iceConnectionState}`);
		};

		this._pc.onicegatheringstatechange = () => {
			console.log(`|Camera| ICE gathering state: ${this._pc.iceGatheringState}`);
		};

		this._pc.onconnectionstatechange = () => {
			console.log(`|Camera| Connection state: ${this._pc.connectionState}`);
		};

		this._pc.onicecandidateerror = (event) => {
			console.error('|Camera| ICE candidate error:', event);
		};
	}
}
