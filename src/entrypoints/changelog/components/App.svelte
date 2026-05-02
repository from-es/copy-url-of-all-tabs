<script lang="ts">
	/**
	 * Main Svelte component for the changelog page.
	 *
	 * @file
	 */

	// Import Svelte
	import { onMount } from "svelte";

	// Import Svelte Module and Types
	import { changelogState, loadChangelog } from "../lib/changelogState.svelte";

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/lib/StateManager/state.svelte.ts";

	// Import Module
	import { createSafeHTML }  from "@/assets/js/utils/setSafeHTML";
	import { setRootFontSize } from "@/assets/js/utils/setRootFontSize";

	// Import
	import type { ChangelogEntry } from "../lib/changelogParser";

	// Import CSS
	import "../css/style.css";



	onMount(async () => {
		initialize();

		await loadChangelog();
	});

	// Constants
	const ALLOW_HTML_ATTRIBUTE = {
		ALLOWED_ATTR: [ "href", "title", "target", "rel" ]
	};

	/**
	 * Initializes the changelog page.
	 *
	 * @returns {void}
	 */
	function initialize(): void {
		setRootFontSize(status.config.OptionsPage.fontsize);
	}
</script>



<!-- Snippet: Renders a single version entry. -->
{#snippet version_entry(entry: ChangelogEntry)}
	<article class="version-entry">
		<h3>[{entry.version}] - {entry.date}</h3>

		<div class="version-content">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html createSafeHTML(entry.contentHtml, ALLOW_HTML_ATTRIBUTE)}
		</div>
	</article>
{/snippet}



<!-- Header metadata -->
<svelte:head>
	<title>Update History - {status.define.Information.name}</title>
</svelte:head>



<main id="contents">
	<article>
		<div class="entry">
			<h1>Update History</h1>

			{#if changelogState.isLoading}
				<div class="status-message">
					<p>Loading update history...</p>
				</div>
			{:else if changelogState.error}
				<div class="status-message error">
					<p>Error: {changelogState.error}</p>
				</div>
			{:else}
				<section id="latest">
					<h2>Latest</h2>

					{#each changelogState.latestEntries as entry (entry.version)}
						{@render version_entry(entry)}
					{/each}
				</section>

				<section id="past">
					<h2>Past</h2>

					<details>
						<summary>View all history</summary>

						<div id="marked">
							{#each changelogState.pastEntries as entry (entry.version)}
								{@render version_entry(entry)}
							{/each}
						</div>
					</details>
				</section>
			{/if}
		</div>
	</article>
</main>



<style>
	/* Styles are managed in external CSS (common.css, style.css), so only minimal structural maintenance is performed here. */
	.status-message {
		padding   : 2rem;
		text-align: center;
		font-size : 1.2rem;
	}

	.error {
		border-radius   : 0.5rem;
		color           : #d32f2f;
		background-color: #fdecea;
	}

	/* Fix font size for lists in Markdown content */
	:global(.version-content ul > li) {
		font-size: 1rem !important;
	}
</style>