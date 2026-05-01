/**
 * Reactive state management for the changelog page.
 *
 * @file
 */

// Import Module
import { fetchAndParseChangelog } from "./changelogService";

// Import Types
import type { ChangelogEntry }    from "./changelogParser";



/**
 * Number of latest history entries to display in the "Latest" section.
 */
const LATEST_COUNT = 3;

/**
 * Reactive state object for the changelog.
 * Consolidates all management variables into a single object using Svelte 5 runes.
 */
const changelogState = $state({
	entries  : [] as ChangelogEntry[],
	isLoading: true,
	error    : null as string | null,

	/**
	 * Derived property for the latest entries.
	 */
	get latestEntries() {
		return this.entries.slice(0, LATEST_COUNT);
	},

	/**
	 * Derived property for the past entries.
	 */
	get pastEntries() {
		return this.entries.slice(LATEST_COUNT);
	}
});

/**
 * Orchestrates the loading of the changelog and updates the reactive state.
 *
 * This function acts as a bridge between the pure JS service and the reactive Svelte state.
 *
 * @returns {Promise<void>} A promise that resolves when the loading is complete.
 */
async function loadChangelog(): Promise<void> {
	try {
		changelogState.entries = await fetchAndParseChangelog();
	} catch (error) {
		console.error("ERROR(changelog): Exception: failed to load update history", { error });

		changelogState.error = (error as Error).message;
	} finally {
		changelogState.isLoading = false;
	}
}



export {
	changelogState,
	loadChangelog
};