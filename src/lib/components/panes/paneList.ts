import Arm from './Arm.svelte';
import Motors from './Motors.svelte';
import Science from './Science.svelte';
import Unknown from './Unknown.svelte';
import Camera from './camera/Camera.svelte';
import AutoNav from './auto/AutoNav.svelte';
import GNSS from './GNSS.svelte';

export const paneList = {
	unknown: Unknown,
	motors: Motors,
	arm: Arm,
	science: Science,
	camera: Camera,
	gnss: GNSS,
	autoNav: AutoNav
};
