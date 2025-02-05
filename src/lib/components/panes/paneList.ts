import Arm from './Arm.svelte';
import Camera from './Camera.svelte';
import Motors from './Motors.svelte';
import Science from './Science.svelte';
import Unknown from './Unknown.svelte';

export const paneList = {
	unknown: Unknown,
	camera: Camera,
	motors: Motors,
	arm: Arm,
	science: Science
};
