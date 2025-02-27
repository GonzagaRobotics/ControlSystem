<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from './Pane.svelte';
	import type { Core } from '$lib/core/core';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	let video: HTMLVideoElement;

	let socket = new WebSocket(`ws://${core.config.rtcSignalingUrl}/control`);
	let pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
	const polite = false;

	pc.onconnectionstatechange = (event) => {
		console.log('Conn', pc.connectionState);
	};

	pc.oniceconnectionstatechange = (event) => {
		console.log('ICE Conn', pc.iceConnectionState);
	};

	let makingOffer = false;

	pc.onnegotiationneeded = async () => {
		console.log('Negotiation needed');

		try {
			makingOffer = true;
			await pc.setLocalDescription();
			socket.send(JSON.stringify(pc.localDescription));
		} catch (err) {
			console.error(err);
		} finally {
			makingOffer = false;
		}
	};

	onMount(() => {
		pc.ontrack = (event) => {
			video.srcObject = event.streams[0];
		};

		pc.onicecandidate = (event) => {
			console.log('THIS SHOULD HAPPEN', event);
			if (event.candidate) {
				console.log('after if');
				console.log('Sending candidate');

				socket.send(JSON.stringify({ candidate: event.candidate }));
			}
		};

		socket.onmessage = async (event) => {
			const message = JSON.parse(event.data);

			if (message.candidate) {
				console.log('Got candidate');

				await pc.addIceCandidate(message.candidate);
				return;
			} else if (message.type === 'close') {
				console.log('Closing connection');

				pc.close();
				pc = new RTCPeerConnection({ iceServers: [] });
				return;
			}

			let ignoreOffer = false;

			const offerCollision =
				message.type === 'offer' && (makingOffer || pc.signalingState !== 'stable');

			ignoreOffer = !polite && offerCollision;
			if (ignoreOffer) {
				return;
			}

			await pc.setRemoteDescription(message);

			if (message.type === 'offer') {
				console.log('Got offer');

				await pc.setLocalDescription();
				socket.send(JSON.stringify(pc.localDescription));
			} else {
				console.log('Got answer');
			}
		};

		socket.onopen = async () => {
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			console.log('Sending offer');

			socket.send(JSON.stringify(offer));
		};

		return () => {
			socket.send(JSON.stringify({ type: 'close' }));
		};
	});
</script>

<Pane {id} {start} {size} containerClasses="flex flex-col justify-center items-center">
	<svelte:fragment slot="main">
		<video bind:this={video} class="" autoplay muted></video>
	</svelte:fragment>
</Pane>
