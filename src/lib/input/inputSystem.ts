import type { Tickable } from '$lib/core/core';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { GamepadManager } from './gamepadManager';

export type Button =
	| 'A'
	| 'B'
	| 'X'
	| 'Y'
	| 'LB'
	| 'RB'
// 	| 'LT'
// 	| 'RT'
	| 'Back'
	| 'Start'
	| 'LS'
	| 'RS'
	| 'Up'
	| 'Down'
	| 'Left'
	| 'Right'
	| 'Center';

export type Axis = 'LX' | 'LY' | 'RX' | 'RY' | 'LT' | 'RT';

type GamepadState = {
	buttons: { [key in Button]: number };
	axes: { [key in Axis]: number };
};

const defaultGamepadState: GamepadState = {
	buttons: {
		A: 0,
		B: 0,
		X: 0,
		Y: 0,
		LB: 0,
		RB: 0,
 		// LT: 0,
 		// RT: -1,
		Back: 0,
		Start: 0,
		LS: 0,
		RS: 0,
		Up: 0,
		Down: 0,
		Left: 0,
		Right: 0,
		Center: 0
	},
	axes: {
		LX: 0,
		LY: 0,
		RX: 0,
		RY: 0,
		LT: 0,
		RT: 0
	}
};

export class InputSystem implements Tickable {
	private readonly _gamepadManager: GamepadManager;

	private _lastGamepadTimestamp: number = 0;
	private _lastGamepadState: GamepadState = defaultGamepadState;
	private _currentGamepadIndex: number = -1;
	private _internalButtonStores: Map<Button, Writable<boolean>> = new Map();
	private _internalAxisStores: Map<Axis, Writable<number>> = new Map();

	constructor() {
		// Prepare writable stores for each button and axis
		for (const button of Object.keys(defaultGamepadState.buttons) as Button[]) {
			this._internalButtonStores.set(button, writable(false));
		}

		for (const axis of Object.keys(defaultGamepadState.axes) as Axis[]) {
			this._internalAxisStores.set(axis, writable(0));
		}

		this._gamepadManager = new GamepadManager();

		this._gamepadManager.gamepad.subscribe((gamepad) => {
			if (gamepad === null) {
				this._lastGamepadTimestamp = 0;
				this._lastGamepadState = defaultGamepadState;
				this._currentGamepadIndex = -1;
			} else {
				this._currentGamepadIndex = gamepad;
			}
		});
	}

	get gamepadConnected(): Readable<boolean> {
		return derived(this._gamepadManager.gamepad, (gamepad) => gamepad != null);
	}

	registerButtonInput(button: Button): Readable<boolean> {
		return { subscribe: this._internalButtonStores.get(button)!.subscribe };
	}

	registerAxisInput(axis: Axis, curve = 1, deadzone = 0.1, inverted = false): Readable<number> {
		return derived(this._internalAxisStores.get(axis)!, (axis) => {
			// Apply deadzone
			if (Math.abs(axis) < deadzone) {
				return 0;
			}

			// Apply curve
			axis = Math.sign(axis) * Math.pow(Math.abs(axis), curve);

			// Apply inversion
			if (inverted) {
				axis = -axis;
			}

			return axis;
		});
	}

	rumbleGamepad(duration: number, strongMagnitude: number, weakMagnitude: number): void {
		if (this._currentGamepadIndex === -1) {
			return;
		}

		const gamepad = navigator.getGamepads()[this._currentGamepadIndex]!;

		gamepad.vibrationActuator?.playEffect('dual-rumble', {
			duration,
			strongMagnitude,
			weakMagnitude
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	tick(_deltaTime: number): void {
		if (this._currentGamepadIndex === -1) {
			return;
		}

		const gamepad = navigator.getGamepads()[this._currentGamepadIndex]!;

		// We can use the timestamp to determine if the gamepad has been updated
		// since the last tick
		if (gamepad.timestamp == this._lastGamepadTimestamp) {
			return;
		}

		// We know that some part of the gamepad state has changed, but we need
		// to determine what inputs actually changed and update their stores
		const newGamepadState: GamepadState = {
			buttons: {
                // See https://hardwaretester.com/gamepad
				A: gamepad.buttons[0].value,
				B: gamepad.buttons[1].value,
				X: gamepad.buttons[3].value,
				Y: gamepad.buttons[2].value,
				LB: gamepad.buttons[4].value,
				RB: gamepad.buttons[5].value,
		 		// LT: gamepad.buttons[6].value,
		 		// RT: gamepad.buttons[7].value,
				Back: gamepad.buttons[8].value,
				Start: gamepad.buttons[9].value,
				LS: gamepad.buttons[10].value,
				RS: gamepad.buttons[11].value,
				Up: gamepad.buttons[12].value,
				Down: gamepad.buttons[13].value,
				Left: gamepad.buttons[14].value,
				Right: gamepad.buttons[15].value,
				Center: gamepad.buttons[16].value
			},
			axes: {
                // See https://hardwaretester.com/gamepad
                
				// // Invert joystick axes so that positive is up and left
                // Positive is down and to the right
				LX: gamepad.axes[0] /* * -1*/,
				LY: gamepad.axes[1] /* * -1*/,
				RX: gamepad.axes[2] /* * -1*/,
				RY: gamepad.axes[3] /* * -1*/,
				LT: gamepad.axes[4],
				RT: gamepad.axes[5]
			}
		};

		for (const buttonString in newGamepadState.buttons) {
			const button = buttonString as Button;

			if (newGamepadState.buttons[button] !== this._lastGamepadState.buttons[button]) {
				this._internalButtonStores.get(button)!.set(newGamepadState.buttons[button] > 0.5);
			}
		}

		for (const axisString in newGamepadState.axes) {
			const axis = axisString as Axis;

			if (newGamepadState.axes[axis] !== this._lastGamepadState.axes[axis]) {
				this._internalAxisStores.get(axis)!.set(newGamepadState.axes[axis]);
			}
		}

		this._lastGamepadTimestamp = gamepad.timestamp;
		this._lastGamepadState = newGamepadState;
	}
}
