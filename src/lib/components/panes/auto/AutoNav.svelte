<script lang="ts">
	import { getContext } from 'svelte';
	import Pane from '../Pane.svelte';
	import { Service } from '$lib/comm/service';
	import type { Core } from '$lib/core/core.svelte';
	import {
		type GetStateRes,
		type InstructReq,
		type InstructRes,
		type SetTargetReq,
		type SetTargetRes,
		type StateMsg,
		type TargetMsg,
		type PlanMsg,
		State,
		Instruction,
		stateToString,
		DummyGetStateRes,
		TargetType,

		targetToString

	} from './autoNav';
	import { Topic } from '$lib/comm/topic';
	import type { StdMsg } from '$lib/comm/interfaces';

	let { start } = $props();

	const core = getContext<Core>('core');

	const getStateService = new Service<null, GetStateRes>(core.ros, 'auto/state','auto_msgs/GetState');
	const instructService = new Service<InstructReq, InstructRes>(core.ros, 'auto/instruct', 'auto_msgs/Instruct');
	const targetService = new Service<SetTargetReq, SetTargetRes>(core.ros, 'auto/target', 'auto_msgs/SetTarget');

	const enableTopic = new Topic<StdMsg<boolean>>(core.ros, 'auto/enable', 'std_msgs/Bool');
	const stateTopic = new Topic<StateMsg>(core.ros, 'auto/state', 'auto_msgs/State');
	const stateTopicSub = stateTopic.subscribe();
	const planTopic = new Topic<PlanMsg>(core.ros, 'auto/plan', 'auto_msgs/Plan');
	const planTopicSub = planTopic.subscribe();
	const targetTopic = new Topic<TargetMsg>(core.ros, 'auto/target', 'auto_msgs/Target');
	const targetTopicSub = targetTopic.subscribe();

	let queriedState = $state(false);
	let autoState = $state<State>(State.DISABLED);
	let plan = $state<PlanMsg | null>(null);
	let target = $state<TargetMsg | null>(null);

	$effect(() => {
		plan = $planTopicSub ?? null;
	});

	$effect(() => {
		autoState = $stateTopicSub?.state ?? State.DISABLED;
	});

	$effect(() => {
		if (!$targetTopicSub) {
			return;
		}

		console.log($targetTopicSub);
		

		if (Number.isNaN($targetTopicSub.location.latitude)) {
			target = null;
			return;
		}

		target = $targetTopicSub;
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

	getStateService.call(null, DummyGetStateRes).then((msg) => {
		autoState = msg.state;

		target = msg.hasTarget ? msg.target : null;
		plan = msg.hasPlan ? msg.plan : null;

		queriedState = true;
	});

	function enableDisable() {
		enableTopic.publish({ data: autoState == State.DISABLED });
	}

	function instruct(instruction: Instruction) {
		instructService.call({ instruction }).then((res) => {
			if (!res.ok) {
				core.sendToast('error', `Failed to ${Instruction[instruction].toLowerCase()}: ${res.reason}`);
			}
		}).catch((err) => {
			core.sendToast('error', `Error sending instruction: ${err}`);
		});
	}

	function onTargetSubmit(event: Event) {
		event.preventDefault();

		// Get form data
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		// Create target message
		const out: TargetMsg = {
			location: {
				latitude: parseFloat(formData.get('lat')!.toString()),
				longitude: parseFloat(formData.get('lon')!.toString()),
				altitude: 0
			},
			type: parseInt(formData.get('type')!.toString())
		};

		target = out;

		targetService.call({ target: out }).then((res) => {
			core.sendToast(res.ok ? 'success' : 'error', res.ok ? 'Ok' : `Failed to set target: ${res.reason}`);
		}).catch((err) => {
			core.sendToast('error', `Error setting target: ${err}`);
		});
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

<Pane
	name="Auto Nav"
	{start}
	size={{ x: 2, y: 1 }}
	containerClasses="grid grid-cols-3"
	loading={!queriedState}
>
	<div class="flex flex-col items-center">
		<h4 class="h4 text-center">Status</h4>

		<p class="text-lg">State: {stateToString(autoState)}</p>
		<p class="text-lg">Plan: {plan?.waypoints.length ?? 'No'} waypoints</p>
		<p class="text-lg">{targetToString(target)}</p>

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
					value="38.419745"
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
					value="-110.774118"
					required
				/>
			</label>

			<label class="label mb-4">
				<span>Type</span>
				<select class="select" name="type">
					<option value="0">GNSS</option>
					<option value="1">ArUco</option>
					<option value="2">Water Bottle</option>
					<option value="3">Rubber Mallet</option>
					<option value="4">Rock Hammer</option>
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
