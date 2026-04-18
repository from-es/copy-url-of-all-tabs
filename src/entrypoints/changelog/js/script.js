/**
 * Convert Markdown to HTML for "Update history".
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-18
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import NPM Package
import { marked } from "marked";

// Import Module
import { initializeConfig }           from "@/assets/js/initializeConfig";
import { setSafeHTML, createSafeDOM } from "@/assets/js/utils/setSafeHTML";



// Configuration values
const CHANGELOG_PATH              = "src/text/changelog.md";  // Path to the changelog file, located in the static file directory
const LATEST_HISTORY_SELECTOR     = "#latest";                // Selector for the element to display the latest history
const PAST_HISTORY_SELECTOR       = "#marked";                // Selector for the element to display all history
const ERROR_NOTIFICATION_SELECTOR = "#contents .entry";       // Selector for the element to display error messages
const HISTORY_HEADER_TAG          = "h4";                     // Header tag used to identify each version in the history
const LATEST_HISTORY_COUNT        = 3;                        // Number of latest history entries to display
const SANITIZED_OPTION            = {                         // Configuration object for DOMPurify (for changelog.md)
	ALLOWED_ATTR: [
		"href", "title", "target", "rel"  // for Anchor Tag
	]
};

/**
 * Custom renderer for marked, configured to open external links in a new tab.
 */
const customLinkRenderer = {
	/**
	 * Renders a link tag.
	 *
	 * @param   {object} options       - Link options
	 * @param   {string} options.href  - Link URL
	 * @param   {string} options.title - Link title
	 * @param   {string} options.text  - Link text
	 * @returns {string}                 Generated HTML anchor tag
	 */
	link({ href, title, text }) {
		let   isLocalLink = false;
		const linkTitle   = title ? `title="${title}"` : `title="${href}"`;

		try {
			// Convert href to an absolute URL based on location.href, even if it is a relative path.
			const url = new URL(href, location.href);

			// Determine as a local link if the origin matches or if href is an in-page anchor.
			isLocalLink = (url.origin === location.origin) || href.startsWith("#");
		} catch (error) {
			// If URL parsing fails, treat it as an external link.
			isLocalLink = false;

			console.error("ERROR(main): Failure: parse url or determine link type", { href, error });
		}

		if (isLocalLink) {
			return `<a href="${href}" ${linkTitle}>${text}</a>`;
		}  else {
			return `<a href="${href}" ${linkTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
		}
	},
};

window.addEventListener("load", main);

/**
 * Main entry point for the changelog page.
 *
 * @returns {Promise<void>}
 */
async function main() {
	try {
		await initialize();
		await setUpdateHistory();
	} catch (error) {
		console.error("ERROR(main): Failure: initialize or display changelog", { error });
	}
}

/**
 * Common initialization process for the page (load settings, apply font size).
 *
 * @returns {Promise<void>}
 */
async function initialize() {
	const { config } = await initializeConfig(null);

	// Dynamically rewrite styles (:root elements in style.css).
	const fontSize = config.OptionsPage.fontsize;
	document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
}

/**
 * Retrieves and parses changelog data, then renders latest and past history to their respective elements.
 *
 * @returns {Promise<void>}
 */
async function setUpdateHistory() {
	try {
		const markdown     = await getMarkdown(CHANGELOG_PATH);
		const markedCustom = createCustomMarkedInstance();
		const html         = markedCustom.parse(markdown);

		renderLatestHistory(html, LATEST_HISTORY_SELECTOR);
		renderPastHistory(html);

	} catch (error) {
		console.error("ERROR(main): Failure: display changelog", { error });

		const elm          = document.querySelector(ERROR_NOTIFICATION_SELECTOR) || document.body;
		const errorMessage = `<p>Failed to load changelog.</p><p>Error: ${error.message}</p>`;

		if (typeof errorMessage === "string") {
			setSafeHTML(elm, errorMessage, SANITIZED_OPTION);
		}
	}
}

/**
 * Retrieves a Markdown file.
 *
 * @param   {string}          path - Path string to the Markdown file
 * @returns {Promise<string>}        Markdown string content
 */
async function getMarkdown(path) {
	const url = browser.runtime.getURL(path);
	try {
		const response = await fetch(url, { cache: "no-store" });

		// Explicitly check if the file does not exist (e.g., 404 Not Found).
		if (response.status === 404) {
			throw new Error(`Markdown file not found. (path: ${path})`);
		}

		// Other HTTP errors.
		if (!response.ok) {
			throw new Error(`Failed to retrieve Markdown file: ${url} (Status: ${response.status})`);
		}

		return response.text();
	} catch (error) {
		// Case where fetch rejects the Promise (e.g., network error).
		if (error instanceof TypeError && error.message === "Failed to fetch") {
			throw new Error(`Network error or file not accessible: ${url}.`, { cause: error });
		} else {
			// Other unexpected errors or custom errors thrown above.
			throw error;
		}
	}
}

/**
 * Returns a marked instance configured to open external links in a new tab.
 *
 * @returns {import("marked").Marked}
 *
 * @see Overwrite renderer.link, Open external link in new tab (https://github.com/markedjs/marked/issues/655#issuecomment-712380889)
 */
function createCustomMarkedInstance() {
	return marked.use({ renderer: customLinkRenderer });
}

/**
 * Adds the latest update history to the specified element based on the HTML string of all history.
 *
 * @param   {string} html   - HTML string to display
 * @param   {string} target - CSS selector string for the target element
 * @returns {void}
 */
function renderLatestHistory(html, target) {
	const targetElement = document.querySelector(target);

	if (!targetElement || typeof html !== "string") {
		return;
	};

	const doc            = createSafeDOM(html, SANITIZED_OPTION);
	const historyHeaders = doc.querySelectorAll(HISTORY_HEADER_TAG);
	const displayCount   = Math.min(historyHeaders.length, LATEST_HISTORY_COUNT);
	const fragment       = new DocumentFragment();

	for (let i = 0; i < displayCount; i++) {
		const header  = historyHeaders[i];
		const content = header.nextElementSibling;

		if (header) {
			fragment.appendChild(header.cloneNode(true));
		}
		if (content) {
			fragment.appendChild(content.cloneNode(true));
		}
	}

	targetElement.replaceChildren();  // Clear existing content.
	targetElement.appendChild(fragment);
}

/**
 * Adds all update history HTML strings to the specified element.
 *
 * @param   {string} html - HTML string to display
 * @returns {void}
 */
function renderPastHistory(html) {
	const targetElement = document.querySelector(PAST_HISTORY_SELECTOR);

	if (!targetElement || typeof html !== "string") {
		return;
	}

	setSafeHTML(targetElement, html, SANITIZED_OPTION);
}