<script lang="ts">
	import { getContext, onMount } from 'svelte';
	import Pane from '../Pane.svelte';
	import EyeSettings from '~icons/mdi/eye-settings';
	import { CONTROL_SOURCE_NAME, type Core } from '$lib/core/core';
	import { RTC } from './rtc';
	import { popup, type PopupSettings } from '@skeletonlabs/skeleton';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const selectSettings: PopupSettings = {
		event: 'click',
		placement: 'bottom-end',
		target: 'sourceSelectPopup'
	};

	const core = getContext<Core>('core');
	const rtc = new RTC(`ws://${core.config.rtcSignalingUrl}`);

	let video: HTMLVideoElement;

	let sources = rtc.sources;
	$: selectedSource = '';

	$: {
		if (selectedSource !== '') {
			rtc.connectToSource(selectedSource);
		}
	}

	onMount(() => {
		rtc.pc.subscribe((current) => {
			// Remove previous video stream
			video.srcObject = null;

			current.ontrack = (event) => {
				video.srcObject = event.streams[0];
			};
		});

		sources.subscribe((newSources) => {
			if (newSources.find((source) => source === selectedSource) || selectedSource == '') {
				return;
			}

			selectedSource = '';
			core.sendToast('warning', 'Your selected source is no longer available');
		});
	});
</script>

<Pane {id} {start} {size} containerClasses="">
	<svelte:fragment slot="main">
		<!-- Source selection button -->
		<button
			class="relative float-right m-2"
			class:animate-pulse={selectedSource === ''}
			use:popup={selectSettings}
		>
			<EyeSettings class="size-7" />
		</button>

		<!-- Source selection options popup -->
		<div class="card p-4 variant-filled-surface" data-popup="sourceSelectPopup">
			<ul class="list">
				{#each $sources as source}
					<li>
						<button
							class="btn-sm hover:variant-filled-primary transition-all"
							class:variant-filled-secondary={selectedSource === source}
							on:click={() => {
								selectedSource = source;
							}}
						>
							{source}
						</button>
					</li>
				{/each}

				{#if $sources.length === 0}
					<li>No sources found</li>
				{/if}
			</ul>
		</div>

		<video bind:this={video} class="" autoplay muted></video>
	</svelte:fragment>
</Pane>
