<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from '../Pane.svelte';
	import { Service } from '$lib/comm/service';
	import type { Core } from '$lib/core/core.svelte';
	import {
		type QueryServiceResponse,
		type StateMsg,
		type InstructionMsg,
		type TargetMsg,
		type PlanMsg,
		State,
		Instruction,
		stateToString
	} from './autoNav';
	import { Topic } from '$lib/comm/topic';

	let { id, start, size } = $props();

	const core = getContext<Core>('core');

	const queryStateService = new Service<null, QueryServiceResponse>(
		core.ros,
		'auto_nav/query_state',
		'auto_nav_interfaces/QueryState'
	);

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

	const stateTopic = new Topic<StateMsg>(core.ros, 'auto_nav/state', 'auto_nav_interfaces/State');
	const stateTopicSub = stateTopic.subscribe();
	const planTopic = new Topic<PlanMsg>(core.ros, 'auto_nav/plan', 'auto_nav_interfaces/Plan');
	const planTopicSub = planTopic.subscribe();

	let queriedState = $state(false);
	let autoState = $state<State>(State.DISABLED);
	let plan = $state<PlanMsg | null>(null);

	$effect(() => {
		plan = $planTopicSub ?? null;
	});

	$effect(() => {
		if ($stateTopicSub) {
			autoState = $stateTopicSub.state;
		}
	});

	let isMoving = $derived(
		autoState == State.TRAVELING ||
			autoState == State.TERMINAL_SEARCHING ||
			autoState == State.TERMINAL_MOVING
	);

	let canPause = $derived(isMoving);
	let canResume = $derived(autoState == State.PAUSED);
	let canExecute = $derived(autoState == State.WAITING);
	let canTerminate = $derived(
		autoState != State.DISABLED && autoState != State.PLANNING && autoState != State.READY
	);

	queryStateService.call(null, { state: State.DISABLED, plan: { waypoints: [] } }).then((msg) => {
		autoState = msg.state;
		plan = msg.plan;
		queriedState = true;
	});

	function enableDisable() {
		enableTopic.publish({ data: autoState == State.DISABLED });
	}

	function instruct(instruction: Instruction) {
		instructionTopic.publish({ instruction });
	}

	function onTargetSubmit(event: Event) {
		event.preventDefault();

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
</script>

{#snippet instructButton(name: string, color: string, instruction: Instruction)}
	<button
		class="btn btn-lg preset-filled-{color}-500 mb-2 w-3/4"
		onclick={() => instruct(instruction)}
	>
		{name}
	</button>
{/snippet}

<Pane {id} {start} {size} containerClasses="grid grid-cols-3" loading={!queriedState}>
	<div class="flex flex-col items-center">
		<h4 class="h4 text-center">Status</h4>

		<p class="text-lg">State: {stateToString(autoState)}</p>
		<p class="text-lg">Current Plan: {plan?.waypoints.length ?? 'No'} waypoints</p>

		<button
			class="btn btn-lg mt-2 w-3/4 preset-filled-{autoState === State.DISABLED
				? 'primary'
				: 'warning'}-500"
			onclick={enableDisable}
		>
			{autoState === State.DISABLED ? 'Enable' : 'Disable'}
		</button>
	</div>

	<div>
		<h4 class="h4 text-center">Pathfind</h4>

		<form onsubmit={onTargetSubmit}>
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
				disabled={autoState != State.READY && autoState != State.PLANNING}
				type="submit"
				class="btn btn-md preset-filled-primary-500 w-full"
			>
				Transmit
			</button>
		</form>
	</div>

	<div class="flex flex-col items-center">
		<h4 class="h4 mb-4 text-center">Navigate</h4>

		{#if canPause}
			{@render instructButton('Pause', 'primary', Instruction.PAUSE)}
		{/if}

		{#if canResume}
			{@render instructButton('Resume', 'primary', Instruction.RESUME)}
		{/if}

		{#if canExecute}
			{@render instructButton('Execute', 'success', Instruction.EXECUTE)}
		{/if}

		{#if canTerminate}
			{@render instructButton('Terminate', 'error', Instruction.TERMINATE)}
		{/if}
	</div>
</Pane>
