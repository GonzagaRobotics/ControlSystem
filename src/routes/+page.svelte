<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import TopBar from '$lib/components/TopBar.svelte';
	import { Core } from '$lib/core/core.svelte';
	import { toaster } from '$lib/core/toaster';
	import { mount, onMount, setContext, unmount } from 'svelte';
	import MainWindow from '$lib/components/MainWindow.svelte';

	const core = new Core(page.data.config, toaster);
	setContext('core', core);

	let selectedTab = $state(core.config.tabs.at(0)?.id ?? '');
	let tabObj = $derived(core.config.tabs.find((tab) => tab.id == selectedTab));
	let tabAttributes = $derived(tabObj?.attributes ?? []);

	setContext('tabAttributes', () => tabAttributes);

	let mainWindow: Record<string, any>;

	beforeNavigate((nav) => {
		if (nav.type == 'leave') {
			unmount(mainWindow);

			core.dispose();
		}
	});

	let lastTickTimestamp: number | undefined;

	function tick(timestamp: number) {
		if (lastTickTimestamp == undefined) {
			lastTickTimestamp = timestamp;
		}

		const delta = timestamp - lastTickTimestamp;

		core.tick(delta);

		lastTickTimestamp = timestamp;
		requestAnimationFrame(tick);
	}

	onMount(() => {
		mainWindow = mount(MainWindow, {
			target: document.querySelector('main')!,
			props: {
				tabObj: () => tabObj
			}
		});

		requestAnimationFrame(tick);
	});
</script>

<main class="flex h-full flex-col gap-2 p-2">
	<TopBar bind:selectedTab />
</main>
