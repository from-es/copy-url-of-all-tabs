<script lang="ts">
	/**
	 * Common layout template for the options page.
	 *
	 * @file
	 */

	// Import Svelte Component
	import Navigation from "./Navigation.svelte";
	import Header     from "@/assets/components/Header.svelte";

	// Import Object: props for Svelte
	const { children, currentPage } = $props();
</script>



<Header />

<main>
	<Navigation current={ currentPage } />

	<div id="contents">
		{@render children()}
	</div>
</main>

<footer id="footer"></footer>