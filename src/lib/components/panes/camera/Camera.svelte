<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import type { Core } from '$lib/core/core.svelte';
	import { RTC } from './rtc';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import { Video } from '@lucide/svelte';

	let { start } = $props();

	const core = getContext<Core>('core');
	const rtc = new RTC(`ws://${core.config.rtcSignalingUrl}`);

	let video: HTMLVideoElement;

	const sources = rtc.sources;
	let selectedSource = $state('');

	let selectOpen = $state(false);

	let maxSize = $state([0, 0]);
	let videoSize = $state([0, 0]);

	$effect(() => {
		if (selectedSource != '') {
			rtc.connectToSource(selectedSource);
		}
	});

	$effect(() => {
		if ($sources.find((source) => source === selectedSource) || selectedSource == '') {
			return;
		}

		selectedSource = '';
		core.sendToast('warning', 'Your selected source is no longer available');
	});

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
	});

	onMount(() => {
		rtc.pc.subscribe((current) => {
			// Remove previous video stream
			video.srcObject = null;

			current.ontrack = (event) => {
				video.srcObject = event.streams[0];
			};
		});
	});
</script>

<Pane name="Camera" {start} size={{ x: 2, y: 1 }}>
	<Popover
		open={selectOpen}
		onOpenChange={(e) => (selectOpen = e.open)}
		positioning={{ placement: 'bottom-end' }}
		triggerBase="relative float-right mr-4"
		triggerClasses={selectedSource === '' ? 'animate-pulse' : ''}
		contentBase="card bg-surface-200-800 p-1"
	>
		{#snippet trigger()}
			<Video size="2rem" />
		{/snippet}

		{#snippet content()}
			<ul class="list">
				{#each $sources as source}
					<li>
						<button
							class="btn-sm hover:preset-filled-primary-500 transition-all"
							class:preset-filled-secondary-500={selectedSource === source}
							onclick={() => (selectedSource = source)}
						>
							{source}
						</button>
					</li>
				{:else}
					<li>No sources found</li>
				{/each}
			</ul>
		{/snippet}
	</Popover>

	<div class="h-full" bind:clientWidth={maxSize[0]} bind:clientHeight={maxSize[1]}>
		<video
			bind:this={video}
			autoplay
			muted
			class="absolute"
			bind:videoWidth={videoSize[0]}
			bind:videoHeight={videoSize[1]}
		></video>
	</div>
</Pane>
