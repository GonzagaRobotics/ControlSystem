import type { Core } from '$lib/core/core.svelte';
import { get, writable, type Writable } from 'svelte/store';

export class GamepadManager {
	private _gamepad: Writable<number | null>;
	private _core: Core;

	constructor(core: Core) {
		this._core = core;
		this._gamepad = writable(null);

		window.addEventListener('gamepadconnected', (e) => {
			if (get(this._gamepad)) {
				const text = 'An additional gamepad was connected, but is being ignored.';

				console.warn(`|GamepadManager| ${text}`);
				this._core.sendToast('warning', text);

				return;
			}

			if (e.gamepad.mapping != 'standard') {
				const text = `Gamepad ${e.gamepad.id} is using non-standard mapping "${e.gamepad.mapping}".`;

				console.warn(`|GamepadManager| ${text}`);
				this._core.sendToast('warning', text);
			}

			const text = `Gamepad ${e.gamepad.id} connected at index ${e.gamepad.index}.`;
			console.log(`|GamepadManager| ${text}`);
			this._core.sendToast('info', text);

			this._gamepad.set(e.gamepad.index);
		});

		window.addEventListener('gamepaddisconnected', (e) => {
			const text = `Gamepad ${e.gamepad.id} disconnected from index ${e.gamepad.index}.`;
			console.log(`|GamepadManager| ${text}`);
			this._core.sendToast('info', text);

			this._gamepad.set(null);
		});
	}

	get gamepad() {
		return { subscribe: this._gamepad.subscribe };
	}
}
