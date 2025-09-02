import type { Core, Tickable } from '$lib/core/core.svelte';
import { derived, writable, type Readable, type Writable } from 'svelte/store';
import { GamepadManager } from './gamepadManager';

export type Button =
	| 'A'
	| 'B'
	| 'X'
	| 'Y'
	| 'LB'
	| 'RB'
	| 'LT'
	| 'RT'
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
		LT: 0,
		RT: 0,
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

/**
 * Options for configuring axis input.
 */
export type AxisInputOptions = {
	/**
	 * The curvature applied to an axis input. Must be greater than 0.
	 * @default 1
	 */
	curve?: number;
	/**
	 * The deadzone applied to an axis input. Must be in range [0, 1].
	 * Note that the deadzone is applied before the curve.
	 * @default 0.1
	 */
	deadzone?: number;
	/**
	 * Whether the axis input is inverted.
	 * @default false
	 */
	inverted?: boolean;
};

/**
 * The InputSystem is responsible for managing connected gamepads and providing
 * convenient methods for working with them.
 */
export class InputSystem implements Tickable {
	private readonly _gamepadManager: GamepadManager;

	private _lastGamepadTimestamp: number = 0;
	private _lastGamepadState: GamepadState = defaultGamepadState;
	private _currentGamepadIndex: number = -1;
	private _internalButtonStores: Map<Button, Writable<boolean>> = new Map();
	private _internalAxisStores: Map<Axis, Writable<number>> = new Map();

	constructor(core: Core) {
		// Prepare writable stores for each button and axis
		for (const button of Object.keys(defaultGamepadState.buttons) as Button[]) {
			this._internalButtonStores.set(button, writable(false));
		}

		for (const axis of Object.keys(defaultGamepadState.axes) as Axis[]) {
			this._internalAxisStores.set(axis, writable(0));
		}

		this._gamepadManager = new GamepadManager(core);

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

	/**
	 * Returns a store that can be used to get input from the specified button.
	 * @param button The button for which to register input.
	 */
	registerButtonInput(button: Button): Readable<boolean> {
		return { subscribe: this._internalButtonStores.get(button)!.subscribe };
	}

	/**
	 * Returns a store that can be used to get input from the specified axis.
	 * @param axis The axis for which to register input.
	 * @param options Options for configuring the axis input.
	 */
	registerAxisInput(axis: Axis, options?: AxisInputOptions): Readable<number> {
		// Set and validate options
		const curve = options?.curve ?? 1;
		if (curve <= 0) {
			throw new Error('Curve must be greater than 0.');
		}

		const deadzone = options?.deadzone ?? 0.1;
		if (deadzone < 0 || deadzone > 1) {
			throw new Error('Deadzone must be in range [0, 1].');
		}

		const inverted = options?.inverted ?? false;

		return derived(this._internalAxisStores.get(axis)!, (input) => {
			// Apply deadzone
			if (Math.abs(input) < deadzone) {
				return 0;
			}

			// Apply curve
			input = Math.sign(input) * Math.pow(Math.abs(input), curve);

			// Apply inversion
			if (inverted) {
				input = -input;
			}

			return input;
		});
	}

	/**
	 * Triggers a rumble effect on the current gamepad.
	 * @param duration The duration of the rumble effect in milliseconds.
	 * @param strongMagnitude The strength of the strong rumble motor in range [0, 1].
	 * @param weakMagnitude The strength of the weak rumble motor in range [0, 1].
	 */
	rumbleGamepad(duration: number, strongMagnitude?: number, weakMagnitude?: number): void {
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
				A: gamepad.buttons[0].value,
				B: gamepad.buttons[1].value,
				X: gamepad.buttons[2].value,
				Y: gamepad.buttons[3].value,
				LB: gamepad.buttons[4].value,
				RB: gamepad.buttons[5].value,
				LT: (gamepad.axes[2] + 1) / 2,
				RT: (gamepad.axes[5] + 1) / 2,
				Back: gamepad.buttons[6].value,
				Start: gamepad.buttons[7].value,
				LS: gamepad.buttons[9].value,
				RS: gamepad.buttons[10].value,
				Up: Math.min(gamepad.axes[7], 0) * -1,
				Down: Math.max(gamepad.axes[7], 0),
				Left: Math.min(gamepad.axes[6], 0) * -1,
				Right: Math.max(gamepad.axes[6], 0),
				Center: gamepad.buttons[8].value
			},
			axes: {
				// Invert joystick axes so that positive is up and left
				LX: gamepad.axes[0] * -1,
				LY: gamepad.axes[1] * -1,
				RX: gamepad.axes[3] * -1,
				RY: gamepad.axes[4] * -1,
				LT: (gamepad.axes[2] + 1) / 2,
				RT: (gamepad.axes[5] + 1) / 2
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
