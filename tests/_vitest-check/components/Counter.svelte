<script lang="ts">
	/**
	 * This component provides a simple counter interface for smoke testing Svelte components
	 * with Vitest and @testing-library/svelte.
	 *
	 * @file
	 */

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