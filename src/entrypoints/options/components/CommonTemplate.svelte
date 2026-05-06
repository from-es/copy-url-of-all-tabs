<script lang="ts">
	/**
	 * Common layout template for the options page.
	 *
	 * @file
	 */

	// Import Svelte Component
	import Navigation from "./Navigation.svelte";

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import Object: props for Svelte
	const { children, currentPage } = $props();
</script>



<header id="header">
	<article>
		<h1>{ status.define.Information.name }</h1>
	</article>
</header>

<main>
	<Navigation current={ currentPage } />

	<div id="contents">
		{@render children()}
	</div>
</main>

<footer id="footer"></footer>