<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from './Pane.svelte';
	import { Core } from '$lib/core/core';
	import { Topic } from '$lib/comm/topic';
	import {
		State,
		Instruction,
		stateToString,
		type StateMsg,
		type TargetMsg,
		type InstructionMsg,
		type PlanMsg
	} from './AutoNav';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	const stateTopic = new Topic<StateMsg>(core.ros, 'auto_nav/state', 'auto_nav_interfaces/State');
	const enableTopic = new Topic<{ data: boolean }>(core.ros, 'auto_nav/enable', 'std_msgs/Bool');
	const instructionTopic = new Topic<InstructionMsg>(
		core.ros,
		'auto_nav/instruction',
		'auto_nav_interfaces/Instruction'
	);
	const targetTopic = new Topic<TargetMsg>(
		core.ros,
		'auto_nav/target',
		'auto_nav_interfaces/Target'
	);
	const planTopic = new Topic<PlanMsg>(core.ros, 'auto_nav/plan', 'auto_nav_interfaces/Plan');

	const stateSub = stateTopic.subscribe();
	const planSub = planTopic.subscribe();
	$: state = $stateSub?.state ?? State.DISABLED;

	$: canPause =
		state == State.TRAVELING || state == State.TERMINAL_MOVING || state == State.TERMINAL_SEARCHING;
	$: canResume = state == State.PAUSED;
	$: canExecute = state == State.WAITING;
	$: canTerminate = canPause || canResume || canExecute;

	function onTargetSubmit(event: Event) {
		// Get form data
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Create target message
		const target: TargetMsg = {
			location: {
				latitude: parseFloat(formData.get('lat')!.toString()),
				longitude: parseFloat(formData.get('lon')!.toString())
			},
			type: parseInt(formData.get('type')!.toString())
		};

		targetTopic.publish(target);
	}

	function onEnableDisable() {
		enableTopic.publish({ data: state === State.DISABLED });
	}

	function onPause() {
		instructionTopic.publish({ instruction: Instruction.PAUSE });
	}

	function onResume() {
		instructionTopic.publish({ instruction: Instruction.RESUME });
	}

	function onExecute() {
		instructionTopic.publish({ instruction: Instruction.EXECUTE });
	}

	function onTerminate() {
		instructionTopic.publish({ instruction: Instruction.TERMINATE });
	}
</script>

<Pane {id} {start} {size} containerClasses="grid grid-cols-3">
	<svelte:fragment slot="main">
		<div class="flex flex-col items-center">
			<h4 class="h4 text-center">Status</h4>

			<p class="text-lg">State: {stateToString(state)}</p>
			{#if $planSub}
				<p class="text-lg">Current Plan: {$planSub.waypoints.length} Waypoints</p>
			{:else}
				<p class="text-lg">Current Plan: None</p>
			{/if}

			<button class="w-3/4 mt-2 btn btn-lg variant-filled-primary" on:click={onEnableDisable}>
				{state === State.DISABLED ? 'Enable' : 'Disable'}
			</button>
		</div>

		<div class="">
			<h4 class="h4 text-center">Pathfind</h4>

			<form on:submit|preventDefault={onTargetSubmit}>
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
						<option value="0">Geo Location</option>
						<option value="1">ARUCO</option>
						<option value="2">Rubber Mallet</option>
						<option value="3">Water Bottle</option>
					</select>
				</label>

				<button
					disabled={state === State.DISABLED}
					type="submit"
					class="w-full btn btn-md variant-filled-primary"
				>
					Transmit
				</button>
			</form>
		</div>

		<div class="flex flex-col items-center">
			<h4 class="mb-4 h4 text-center">Navigate</h4>

			{#if canPause}
				<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary" on:click={onPause}>
					Pause
				</button>
			{/if}

			{#if canResume}
				<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary" on:click={onResume}>
					Resume
				</button>
			{/if}

			{#if canExecute}
				<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary" on:click={onExecute}>
					Execute
				</button>
			{/if}

			{#if canTerminate}
				<button class="w-3/4 mb-2 btn btn-lg variant-filled-primary" on:click={onTerminate}>
					Terminate
				</button>
			{/if}
		</div>
	</svelte:fragment>
</Pane>
