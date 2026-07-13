import type { StdMsg } from '$lib/comm/interfaces';
import { Topic } from '$lib/comm/topic';
import { Core } from '$lib/core/core.svelte';

export class RTC {
	private _pc = new RTCPeerConnection();

	// Signaling from the source to us
	private _signalSrcTopic: Topic<StdMsg<string>>;
	// Signaling from us to the source
	private _signalSinkTopic: Topic<StdMsg<string>>;

	public get pc(): RTCPeerConnection {
		return this._pc;
	}

	constructor(core: Core) {
		this._signalSrcTopic = new Topic(core.ros, "/webrtc/signal_src", "std_msgs/String");
		this._signalSinkTopic = new Topic(core.ros, "/webrtc/signal_sink", "std_msgs/String");

		this.setupLogListeners();

		this._signalSrcTopic.subscribe().subscribe((msg) => {
			if (msg) {
				this.onMessage(JSON.parse(msg.data));
			}
		});
	}

	async connect() {
		this._signalSinkTopic.publish({ data: "{ \"type\": \"connect\" }" });
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async onMessage(message: any) {
		if (message.type == "offer") {
			console.log("|Camera| Got offer");

			await this._pc.setRemoteDescription(message);
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
