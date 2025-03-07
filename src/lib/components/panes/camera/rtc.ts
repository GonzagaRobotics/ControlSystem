import { CONTROL_SOURCE_NAME } from '$lib/core/core';
import { get, writable, type Readable, type Writable } from 'svelte/store';

export class RTC {
	/** The websocket to the signaling server. */
	readonly socket: WebSocket;

	private _pc: Writable<RTCPeerConnection>;
	private _sources: Writable<string[]>;
	private _makingOffer: boolean;

	public get pc(): Readable<RTCPeerConnection> {
		return this._pc;
	}

	public get sources(): Readable<string[]> {
		return this._sources;
	}

	constructor(url: string) {
		this._pc = writable(new RTCPeerConnection());
		this._sources = writable([]);
		this.socket = new WebSocket(`${url}/${CONTROL_SOURCE_NAME}`);
		this._makingOffer = false;

		this.setup();
	}

	async connectToSource(source: string) {
		this.socket.send(JSON.stringify({ type: 'sourceChange', to: source }));

		const pc = get(this._pc);

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);

		console.log('|Camera| Sending offer');

		this.socket.send(JSON.stringify(offer));
	}

	reset() {
		this._pc.set(new RTCPeerConnection());
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private async onMessage(message: any) {
		switch (message.type) {
			case 'sources': {
				console.log('|Camera| Got new sources');
				this._sources.set(message.sources);
				break;
			}
			case 'candidate': {
				console.log('|Camera| Got candidate');
				get(this._pc).addIceCandidate(message.candidate);
				break;
			}
			default: {
				const pc = get(this._pc);

				// As the impolite peer, we ignore offers during a collision
				if (message.type === 'offer' && (this._makingOffer || pc.signalingState !== 'stable')) {
					return;
				}

				await pc.setRemoteDescription(message);

				if (message.type == 'offer') {
					console.log('|Camera| Got offer');

					await pc.setLocalDescription();
					this.socket.send(JSON.stringify(pc.localDescription));
				} else if (message.type == 'answer') {
					console.log('|Camera| Got answer');
				} else {
					console.log('|Camera| Unknown message type:', message.type);
				}
			}
		}
	}

	private setup() {
		const pc = get(this._pc);

		this.setupLogListeners();

		pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.socket.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
			}
		};

		pc.onnegotiationneeded = async () => {
			console.log(`|Camera| Negotiation needed`);

			try {
				this._makingOffer = true;
				const offer = await pc.createOffer();
				await pc.setLocalDescription(offer);
				this.socket.send(JSON.stringify(offer));
			} catch (err) {
				console.error(err);
			} finally {
				this._makingOffer = false;
			}
		};

		this.socket.onmessage = (ev) => {
			this.onMessage(JSON.parse(ev.data));
		};

		// this.socket.onmessage = async (event) => {
		// 	const message = JSON.parse(event.data);

		// 	if (message.candidate) {
		// 		console.log('Got candidate');

		// 		await this.pc.addIceCandidate(message.candidate);
		// 		return;
		// 	} else if (message.type === 'close') {
		// 		console.log('Closing connection');

		// 		this.pc.close();
		// 		// this.pc = new RTCPeerConnection({ iceServers: [] });
		// 		return;
		// 	}

		// 	let ignoreOffer = false;

		// 	const offerCollision =
		// 		message.type === 'offer' && (this._makingOffer || this.pc.signalingState !== 'stable');

		// 	ignoreOffer = !this.polite && offerCollision;
		// 	if (ignoreOffer) {
		// 		return;
		// 	}

		// 	await this.pc.setRemoteDescription(message);

		// 	if (message.type === 'offer') {
		// 		console.log('Got offer');

		// 		await this.pc.setLocalDescription();
		// 		this.socket.send(JSON.stringify(this.pc.localDescription));
		// 	} else {
		// 		console.log('Got answer');
		// 	}
		// };

		this.socket.onclose = () => {
			console.log('|Camera| WebSocket closed');
		};

		this.socket.onerror = (event) => {
			console.error('|Camera| WebSocket error', event);
		};
	}

	private setupLogListeners() {
		const pc = get(this._pc);

		pc.onsignalingstatechange = () => {
			console.log(`|Camera| Signaling state: ${pc.signalingState}`);
		};

		pc.oniceconnectionstatechange = () => {
			console.log(`|Camera| ICE connection state: ${pc.iceConnectionState}`);
		};

		pc.onicegatheringstatechange = () => {
			console.log(`|Camera| ICE gathering state: ${pc.iceGatheringState}`);
		};

		pc.onconnectionstatechange = () => {
			console.log(`|Camera| Connection state: ${pc.connectionState}`);
		};

		pc.onicecandidateerror = (event) => {
			console.error('|Camera| ICE candidate error:', event);
		};
	}
}
