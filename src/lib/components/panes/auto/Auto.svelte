<script lang="ts">
	import { getContext } from 'svelte';
    import { type Readable } from 'svelte/store';
	import Pane from '../Pane.svelte';
	import type { Core } from '$lib/core/core.svelte';
	import { ActionClient, type ActionPacket } from '$lib/comm/action';
	import { type GoToGoal, type GoToRes, type GoToFeedback, StateEnum, stateToString } from './auto';

	let { start } = $props();

	const core = getContext<Core>('core');

    const gotoAction = new ActionClient<GoToGoal, GoToRes, GoToFeedback>(core.ros, 'auto/goto', 'auto_msgs/GoTo');

    let gotoHandle = $state<Readable<ActionPacket<GoToRes, GoToFeedback> | undefined> | null>(null);

    let goalLat = $state<number>(38.408303);
    let goalLon = $state<number>(-110.785918);
    let goalType = $state<string>("0");

    let running = $derived.by(() => {
        if (gotoHandle == null) {
            return false;
        }

        return $gotoHandle == undefined || $gotoHandle.type === 'feedback';
    });
    let gotoState = $derived.by(() => {
        if (gotoHandle == null) {
            return undefined;
        }

        if ($gotoHandle == undefined || $gotoHandle.type === 'aborted') {
            return undefined;
        }

        return ($gotoHandle.data as GoToRes | GoToFeedback).state.state;
    });
    let result = $derived.by(() => {
        if (gotoHandle == null) {
            return undefined;
        }

        if ($gotoHandle == undefined || $gotoHandle.type === 'feedback') {
            return undefined;
        }

        return $gotoHandle.type;
    });

    
    let plan = $state<[number, number][]>([]);
    /** Waypoint that is currently being approached */
    let currentWp = $state<number>(0);

    $effect(() => {
        // No handle or waiting for the first packet, so we can't do anything yet
        if (gotoHandle == null || $gotoHandle == undefined) {
            return;
        }

        if ($gotoHandle.type === 'feedback') {
            const feedbackRaw = $gotoHandle.data as GoToFeedback;
            const feedback = JSON.parse(feedbackRaw.status);
            
            if (feedbackRaw.state.state == StateEnum.PLANNING) {
                plan = feedback?.wp ?? [];
                core.ipcBus.set({ type: "auto_plan", data: feedback?.wp ?? [] });
            }
            else if (feedbackRaw.state.state == StateEnum.TRAVELING) {
                currentWp = feedback.wp;
            }
        } 
        else if ($gotoHandle.type === 'result') {
            const resultRaw = $gotoHandle.data as GoToRes;
            const result = JSON.parse(resultRaw.result);

            console.log('completed');
            
        }
        else if ($gotoHandle.type === 'aborted') {
            // const result = $gotoHandle.data as string;
            console.log($gotoHandle.data);
            
            core.sendToast("error", "GoTo aborted: " + $gotoHandle.data);
        }
    })

    function sendGoto() {
        const goal: GoToGoal = {
            target: {
                location: {
                    latitude: goalLat,
                    longitude: goalLon
                },
                type: parseInt(goalType),
            }
        }

        try {
            gotoHandle = gotoAction.call(goal);
        }
        catch (error) {
            gotoHandle = null;
            core.sendToast("error", "Failed to send GoTo goal: " + error);
        }
    }

    function stopGoto() {
        if (gotoHandle == null) {
            return;
        }

        gotoHandle = null;
        gotoAction.cancelAll();
    }
</script>

<Pane
	name="Autonomy"
	{start}
	size={{ x: 2, y: 1 }}
	containerClasses="grid grid-cols-2 gap-2"
>

<div class="flex flex-col items-center gap-2 p-4">
    <h3 class="h3">Control</h3>

    <div class="w-full">
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
                bind:value={goalLat}
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
                bind:value={goalLon}
            />
        </label>

        <label class="label mb-4">
            <span>Type</span>
            <select class="select" name="type" bind:value={goalType}>
                <option value="0" selected>GNSS</option>
                <option value="1">ArUco</option>
                <option value="2">Water Bottle</option>
                <option value="3">Rubber Mallet</option>
                <option value="4">Rock Hammer</option>
            </select>
        </label>

        <button class="btn btn-lg w-full preset-filled-primary-500" onclick={sendGoto}>Transmit</button>
    </div>

    {#if running}
        <button class="mt-6 btn btn-lg w-full preset-filled-warning-500" onclick={stopGoto}>Stop</button>
    {/if}
</div>

<div class="flex flex-col items-center gap-2 p-4">
    <h3 class="h3">Status</h3>

    {#if $gotoHandle}
        {#if result == "aborted"}
            <p class="text-lg text-error-500">Action aborted</p>
        {:else if result == "result"}
            <p class="text-lg text-success-500">Action completed</p>
        {:else}
            <p class="text-lg">State: {stateToString(gotoState ?? StateEnum.UNKNOWN)}</p>
            
            {#if plan.length > 0}
                <p class="text-lg">Plan: {plan.length} waypoints</p>

                <p class="text-lg">Target waypoint: {currentWp + 1} / {plan.length}</p>
            {/if}
        {/if}

    {:else}
        <p class="text-lg">Waiting for input...</p>
    {/if}
</div>
</Pane>