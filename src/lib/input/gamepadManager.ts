import { get, writable, type Writable } from 'svelte/store';

export class GamepadManager {
	private _gamepad: Writable<number | null>;

	constructor() {
		this._gamepad = writable(null);

		window.addEventListener('gamepadconnected', (e) => {
			if (get(this._gamepad)) {
				console.warn('|GamepadManager| An additional gamepad was connected, but is being ignored.');

				return;
			}

			console.log(
				`|GamepadManager| Gamepad ${e.gamepad.id} connected at index ${e.gamepad.index}.`
			);

			this._gamepad.set(e.gamepad.index);
		});

		window.addEventListener('gamepaddisconnected', (e) => {
			console.log(
				`|GamepadManager| Gamepad ${e.gamepad.id} disconnected from index ${e.gamepad.index}.`
			);

			this._gamepad.set(null);
		});
	}

	get gamepad() {
		return { subscribe: this._gamepad.subscribe };
	}
}
