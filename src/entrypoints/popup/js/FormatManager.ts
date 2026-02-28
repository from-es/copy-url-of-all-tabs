// WXT provided cross-browser compatible Types
import type { Browser } from "wxt/browser";

// Import Script
import { escapeHTML } from "@/assets/js/utils/escapeHTML";

// Types
type FormatType = "text" | "json" | "custom";



/**
 * Manages the formatting of tab data into various string formats.
 * @dependency   escapeHTML
 * @lastModified 2026-02-27
 */
export class FormatManager {
	/**
	 * Formats an array of tabs into a specified string format.
	 * @param   {Browser.tabs.Tab[]} tabs             - The array of tabs to format.
	 * @param   {FormatType}         format           - The target format (e.g., "text", "json", "custom").
	 * @param   {string | null}      [template=null]  - The template string for custom formatting.
	 * @param   {boolean}            [sanitize=false] - Whether to HTML-escape content in custom formats.
	 * @returns {string}                              - The formatted string.
	 * @throws  {Error}                               - If an unknown format is specified.
	 */
	static format(tabs: Browser.tabs.Tab[], format: FormatType, template: string | null = null, sanitize: boolean = false): string {
		let result: string;

		switch (format) {
			case "text":
				result = this.#text(tabs);
				break;
			case "json":
				result = this.#json(tabs);
				break;
			case "custom":
				result = this.#custom(tabs, template, sanitize);
				break;
			default: {
				// This block is unreachable because of the `FormatType` type guard, but kept for safety.
				const message = "Error: no match switch case in FormatManager.format";
				console.error("ERROR(tab): Error: no match switch case in FormatManager.format", { tabs, format, template, sanitize });

				throw new Error(message);
			}
		}

		console.debug("DEBUG(tab): format manager output", { format, result });

		return result;
	}

	/**
	 * Formats tab URLs into a newline-separated string.
	 * @private
	 * @param   {Browser.tabs.Tab[]} tabs - The array of tabs.
	 * @returns {string}                  - A string of URLs.
	 */
	static #text(tabs: Browser.tabs.Tab[]): string {
		const array  = tabs.map((tab) => tab.url);
		const result = array.join("\n");

		return result;
	}

	/**
	 * Formats tab titles and URLs into a JSON string.
	 * @private
	 * @param   {Browser.tabs.Tab[]} tabs - The array of tabs.
	 * @returns {string}                  - A JSON string representing the tabs.
	 */
	static #json(tabs: Browser.tabs.Tab[]): string {
		const array  = tabs.map((tab) => ({ title: tab.title, url: tab.url }));
		const result = JSON.stringify(array, null, "\t");

		return result;
	}

	/**
	 * Formats tabs using a custom user-defined template.
	 * @private
	 * @param   {Browser.tabs.Tab[]} tabs     - The array of tabs.
	 * @param   {string | null}      template - The template string, using $title and $url placeholders.
	 * @param   {boolean}            sanitize - Whether to HTML-escape the tab titles.
	 * @returns {string}                      - The formatted string.
	 */
	static #custom(tabs: Browser.tabs.Tab[], template: string | null, sanitize: boolean): string {
		if ( !template ) {
			return "Error, Row template is empty! (see options page)";
		}

		const array = tabs.map(
			(tab) => {
				const title          = tab.title ?? "";
				const url            = tab.url   ?? "";
				const sanitizedTitle = sanitize ? escapeHTML(title) : title;

				const placeholders = {
					"\\$title": sanitizedTitle,
					"\\$url"  : url
				};

				let current = template;
				for (const [ key, value ] of Object.entries(placeholders)) {
					current = current.replace(new RegExp(key, "gi"), String(value));
				}

				return current;
			}
		);
		const result = array.join("\n");

		return result;
	}
}