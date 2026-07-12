import * as ROSLIB from 'roslib';
import { Ros } from './ros.svelte';
import { writable, type Readable } from 'svelte/store';

export type ActionPacket<R, F> = {
    type: 'feedback' | 'result' | 'aborted';
    data: R | F | string;
}

export class ActionClient<G, R, F> {
    private _internal: ROSLIB.Action | null = null;

    constructor(ros: Ros, name: string, actionType: string) {
        if (ros.internal) {
            this._internal = new ROSLIB.Action({
                ros: ros.internal,
                name: name,
                actionType: actionType
            });
        }
    }

    call(goal: G): Readable<ActionPacket<R, F> | undefined> {
        if (this._internal == null) {
            throw new Error('Actions cannot be faked yet');
        }

        const store = writable<ActionPacket<R, F> | undefined>();
        const id = this._internal.sendGoal(goal,
            (result) => {
                store.set({
                    type: 'result',
                    data: Ros.toJsStyle(result) as R
                });
            },
            (feedback) => {
                store.set({
                    type: 'feedback',
                    data: Ros.toJsStyle(feedback) as F
                });
            },
            (failed) => {
                store.set({
                    type: 'aborted',
                    data: failed
                });
            }
        );

        if (id == null) {
            throw new Error('Failed to send goal');
        }

        return store;
    }

    cancelAll() {
        this._internal?.cancelAllGoals();
    }
}