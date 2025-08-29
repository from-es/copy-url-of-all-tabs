<script lang="ts">
	import { onMount } from "svelte";

	export let count: number = 0;
	const increment = () => {
		count += 1;
	};

	onMount(() => {
		// If browser-specific lifecycle functions like onMount are included,
		// an error will occur if Vitest does not correctly recognize the browser environment.
		console.log("Counter component mounted");
	});
</script>

<main>
	<h1>Counter</h1>
	<p>Current count: {count}</p>
	<button on:click={increment}>Increment</button>
</main>