<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import type { Readable } from 'svelte/store';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');
</script>

<Pane {id} {start} {size} containerClasses="grid grid-cols-3">
	<svelte:fragment slot="main">
		<div class="">
			<h4 class="h4 text-center">Status</h4>

			<p class="text-center text-lg">State: Disabled</p>
			<p class="text-center text-lg">Current Target: None</p>
			<p class="text-center text-lg">Current Plan: None</p>
			<p class="text-center text-lg">Last Instruction: N/A</p>
		</div>

		<div class="">
			<h4 class="h4 text-center">Pathfind</h4>

			<form>
				<label class="label mb-2">
					<span>Latitude</span>
					<input
						class="input"
						type="number"
						name="lat"
						placeholder="Latitude"
						min="-90"
						max="90"
						step="any"
						required
					/>
				</label>

				<label class="label mb-2">
					<span>Longitude</span>
					<input
						class="input"
						type="number"
						name="lon"
						placeholder="Longitude"
						min="-180"
						max="180"
						step="any"
						required
					/>
				</label>

				<label class="label mb-4">
					<span>Type</span>
					<select class="select" name="type">
						<option value="0">GNSS</option>
						<option value="1">Post</option>
						<option value="2">Rubber Mallet</option>
						<option value="3">Water Bottle</option>
					</select>
				</label>

				<button type="submit" class="w-full btn btn-md variant-filled-primary">Transmit</button>
			</form>
		</div>

		<div class="flex flex-col items-center">
			<h4 class="mb-4 h4 text-center">Navigate</h4>

			<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary">Resume</button>
			<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary">Execute</button>
		</div>
	</svelte:fragment>
</Pane>
