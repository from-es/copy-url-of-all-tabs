/**
 * Provides functionality to parse changelog Markdown into structured data.
 *
 * @file
 */

// Import NPM Package
import { marked } from "marked";
import DOMPurify  from "dompurify";



/**
 * Represents a single version entry in the changelog.
 */
interface ChangelogEntry {
	/**
	 * @property {string} version - The version number.
	 */
	version: string;
	/**
	 * @property {string} date - The release date.
	 */
	date: string;
	/**
	 * @property {string} contentHtml - The parsed HTML content of the version entry.
	 */
	contentHtml: string;
}

/**
 * Parser configuration for marked.
 */
const renderer = new marked.Renderer();

/**
 * Configuration for DOMPurify.
 */
const SANITIZE_OPTIONS = {
	ALLOWED_ATTR: [ "href", "title", "target", "rel" ]
};

/**
 * Custom link renderer to open external links in a new tab.
 *
 * @param   {object} params - The link parameters including href, title, and text.
 * @returns {string}          The HTML string for the link.
 */
renderer.link = ({ href, title, text }) => {
	const isExternal = href.startsWith("http") && !href.includes(location.hostname);
	const titleAttr  = title ? ` title="${title}"` : "";

	if (isExternal) {
		return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
	}

	return `<a href="${href}"${titleAttr}>${text}</a>`;
};

/**
 * Custom heading renderer to offset levels.
 * Maps Markdown H3 (###) to HTML h4.
 *
 * @param   {object} params - The heading parameters including depth and text.
 * @returns {string}          The HTML string for the heading.
 */
renderer.heading = ({ depth, text }) => {
	// Offset by 1: H3 becomes h4
	const level = depth + 1;

	return `<h${level}>${text}</h${level}>`;
};

/**
 * Regular expression to split the changelog by version sections.
 * Matches a newline followed by an H2 header for a version.
 */
const VERSION_SECTION_SEPARATOR = /\n(?=## \[(?:.*?)\] - (?:.*?)\n)/;

/**
 * Regular expression to match and extract version and date from an H2 header.
 * Example: "## [1.0.0] - 2024-01-01\n"
 */
const VERSION_HEADER_PATTERN = /^## \[(.*?)\] - (.*?)\n/;

/**
 * Regular expression to remove the version header from a section to get the content.
 */
const VERSION_HEADER_CLEANUP_PATTERN = /^## .*?\n/;

/**
 * Parses the changelog Markdown string into an array of version entries.
 *
 * @param   {string}                   markdown - The raw Markdown string.
 * @returns {Promise<ChangelogEntry[]>}           An array of parsed ChangelogEntry objects.
 */
async function parseChangelog(markdown: string): Promise<ChangelogEntry[]> {
	// Split by H2 headers (versions)
	const versionSections           = markdown.split(VERSION_SECTION_SEPARATOR);
	const entries: ChangelogEntry[] = [];

	for (const section of versionSections) {
		const match = section.match(VERSION_HEADER_PATTERN);

		if (!match) {
			continue;
		}

		const version         = match[1];
		const date            = match[2];
		const contentMarkdown = section.replace(VERSION_HEADER_CLEANUP_PATTERN, "").trim();

		// Parse the content (categories and list items)
		const rawHtml = await marked.parse(contentMarkdown, { renderer });

		// Sanitize the HTML
		const contentHtml = DOMPurify.sanitize(rawHtml as string, SANITIZE_OPTIONS);

		entries.push({
			version,
			date,
			contentHtml
		});
	}

	return entries;
}



export type {
	ChangelogEntry
};
export {
	parseChangelog
};