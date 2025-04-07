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
	import { Service } from '$lib/comm/service';

	export let id: string;
	export let start: { x: number; y: number };
	export let size: { x: number; y: number };

	const core = getContext<Core>('core');

	const queryStateService = new Service<null, StateMsg>(
		core.ros,
		'auto_nav/query_state',
		'auto_nav_interfaces/QueryState'
	);

	const stateTopic = new Topic<StateMsg>(core.ros, 'auto_nav/state', 'auto_nav_interfaces/State');
	const enableTopic = new Topic<{ data: boolean }>(core.ros, 'auto_nav/enable', 'std_msgs/Bool');
	const instructionTopic = new Topic<InstructionMsg>(
		core.ros,
		'auto_nav/instruction',
		'auto_nav_interfaces/Instruction'
	);

	$: queriedState = false;
	$: state = State.DISABLED;

	$: isMoving =
		state === State.TRAVELING ||
		state === State.TERMINAL_SEARCHING ||
		state === State.TERMINAL_MOVING;
	$: canPause = isMoving;
	$: canResume = state === State.PAUSED;
	$: canExecute = state === State.WAITING;
	$: canTerminate =
		canPause || canResume || canExecute || state === State.SUCCESS || state === State.FAILURE;

	queryStateService.call(null, { state: State.DISABLED }).then((msg) => {
		state = msg.state;
		queriedState = true;
	});

	stateTopic.subscribe().subscribe((msg) => {
		if (msg) {
			state = msg.state;
		}
	});

	function enableDisable() {
		enableTopic.publish({ data: state === State.DISABLED });
	}

	function instruct(instruction: Instruction) {
		instructionTopic.publish({ instruction });
	}
</script>

<Pane {id} {start} {size} containerClasses="grid grid-cols-3" loading={!queriedState}>
	<svelte:fragment slot="main">
		<div class="flex flex-col items-center">
			<h4 class="h4 text-center">Status</h4>

			<p class="text-lg">State: {stateToString(state)}</p>
			<p class="text-lg">Current Plan: None</p>

			<button
				class="w-3/4 mt-2 btn btn-lg variant-filled-{state === State.DISABLED
					? 'primary'
					: 'warning'}"
				on:click={enableDisable}
			>
				{state === State.DISABLED ? 'Enable' : 'Disable'}
			</button>
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
						<option value="0">Geo Location</option>
						<option value="1">ARUCO</option>
						<option value="2">Rubber Mallet</option>
						<option value="3">Water Bottle</option>
					</select>
				</label>

				<button
					disabled={state != State.READY}
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
				<button
					class="w-3/4 mb-2 btn btn-lg variant-filled-primary"
					on:click={() => instruct(Instruction.PAUSE)}
				>
					Pause
				</button>
			{/if}

			{#if canResume}
				<button
					class="w-3/4 mb-2 btn btn-lg variant-filled-primary"
					on:click={() => instruct(Instruction.RESUME)}
				>
					Resume
				</button>
			{/if}

			{#if canExecute}
				<button
					class="w-3/4 mb-2 btn btn-lg variant-filled-success"
					on:click={() => instruct(Instruction.EXECUTE)}
				>
					Execute
				</button>
			{/if}

			{#if canTerminate}
				<button
					class="w-3/4 mb-2 btn btn-lg variant-filled-error"
					on:click={() => instruct(Instruction.TERMINATE)}
				>
					Terminate
				</button>
			{/if}
		</div>
	</svelte:fragment>
</Pane>
