<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import type { Core } from '$lib/core/core.svelte';
	import { RTC } from './rtc';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import { Video } from '@lucide/svelte';
	import { Topic } from '$lib/comm/topic';
	import type { StdMsg } from '$lib/comm/interfaces';

	let { start } = $props();

	const core = getContext<Core>('core');
	const rtc = new RTC(core);

	let video: HTMLVideoElement;

	let maxSize = $state([0, 0]);
	let videoSize = $state([0, 0]);

	$effect(() => {
		if (!video) {
			return;
		}

		if (videoSize[0] == 0 || videoSize[1] == 0) {
			return;
		}

		const aspect = videoSize[0] / videoSize[1];

		// Find the biggest width and height that fits the container
		if (aspect > maxSize[0] / maxSize[1]) {
			video.width = maxSize[0];
			video.height = maxSize[0] / aspect;
		} else {
			video.width = maxSize[1] * aspect;
			video.height = maxSize[1];
		}

		video.style.left = `${(maxSize[0] - video.width) / 2}px`;
	});

	$effect(() => {
		rtc.pc.ontrack = (event) => {
			rtc.pc.getTransceivers()[0].receiver.jitterBufferTarget = 0;
			video.srcObject = event.streams[0];
		};

		rtc.connect();

		return () => {
			rtc.pc.close();
		}
	})
</script>

<Pane name="Camera" {start} size={{ x: 2, y: 1 }}>
	<div class="h-full" bind:clientWidth={maxSize[0]} bind:clientHeight={maxSize[1]}>
		<video
			bind:this={video}
			autoplay
			playsinline
			muted
			class="absolute"
			bind:videoWidth={videoSize[0]}
			bind:videoHeight={videoSize[1]}
		></video>
	</div>
</Pane>
