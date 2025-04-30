<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import type { Core } from '$lib/core/core.svelte';
	import { RTC } from './rtc';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import { Video } from '@lucide/svelte';

	let { id, start, size } = $props();

	const core = getContext<Core>('core');
	const rtc = new RTC(`ws://${core.config.rtcSignalingUrl}`);

	let video: HTMLVideoElement;

	const sources = rtc.sources;
	let selectedSource = $state('');

	let selectOpen = $state(false);

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

<Pane {id} {start} {size}>
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

	<video bind:this={video} autoplay muted></video>
</Pane>
