<script lang="ts">
	import { page } from '$app/stores';
</script>

<main class="w-[100vw] h-[100vh] flex justify-center items-center">
	<h1 class="h1 text-center">{$page.error?.message}</h1>
</main>
