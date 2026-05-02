/**
 * Fetches and initiates parsing of the changelog file.
 *
 * @file
 */

// WXT provided cross-browser compatible API and Types.
import { browser, type PublicPath } from "wxt/browser";

// Import Module and Types
import { parseChangelog, type ChangelogEntry } from "./changelogParser";

/**
 * Path to the changelog file, located in the static file directory.
 */
const CHANGELOG_PATH = "src/text/changelog.md";

/**
 * Fetches the changelog Markdown file and parses it into an array of entries.
 *
 * This function is pure JavaScript/WXT logic and does not depend on Svelte's reactivity system.
 *
 * @returns {Promise<ChangelogEntry[]>} An array of parsed ChangelogEntry objects.
 * @throws  {Error}                    If the fetch fails or the response is not OK.
 */
export async function fetchAndParseChangelog(): Promise<ChangelogEntry[]> {
	const url      = browser.runtime.getURL(CHANGELOG_PATH as PublicPath);
	const response = await fetch(url, { cache: "no-store" });

	if (!response.ok) {
		throw new Error(`Failed to load changelog: ${response.statusText}`);
	}

	const markdown = await response.text();

	return await parseChangelog(markdown);
}