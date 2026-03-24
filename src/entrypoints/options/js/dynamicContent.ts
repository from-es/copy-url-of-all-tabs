/**
 * Manages dynamically changing content on the options screen.
 *
 * @file
 * @lastModified 2026-03-24
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import Types
import type { Config, Define } from "@/assets/js/types/index";



/**
 * Define only the necessary parts to receive the status type from main.svelte.
 *
 * Note: Changes are required if the $props() type in main.svelte is updated.
 */
type Status = {
	define: Define;
	config: Config;
};



/**
 * Class that manages dynamically changing content on the options screen (browser-specific store links, warning messages, etc.).
 *
 * @lastModified 2026-03-24
 */
export class DynamicContent {
	private status   : Status;
	private storeData: Define["Information"]["BrowserExtensionStore"][string] | null;

	/**
	 * @param {Status} status - Application state object.
	 */
	constructor(status: Status) {
		this.status    = status;
		this.storeData = this.getBrowserStoreData();
	}

	/**
	 * Determines the type of the running browser.
	 *
	 * Note: Caution during refactoring as this is hardcoded depending on manifest.json.
	 *
	 * @dependency manifest.json (has property, "browser_specific_settings" or "minimum_chrome_version")
	 *
	 * @returns {"chrome" | "firefox" | null} - Browser type, or null if it cannot be determined.
	 */
	private getBrowserType(): "chrome" | "firefox" | null {
		const manifest = browser.runtime.getManifest();

		// Firefox: Does it have the "browser_specific_settings" property?
		const isFirefox = Object.hasOwn(manifest, "browser_specific_settings");
		if (isFirefox) {
			return "firefox";
		}

		// Chrome: Does it have a valid "minimum_chrome_version" property?
		const isChrome = Object.hasOwn(manifest, "minimum_chrome_version") && typeof manifest.minimum_chrome_version === "string" && manifest.minimum_chrome_version.length > 0;
		if (isChrome) {
			return "chrome";
		}

		return null;
	}

	/**
	 * Gets the store information corresponding to the determined browser type.
	 *
	 * @returns {Define["Information"]["BrowserExtensionStore"][string] | null} - Store information, or null if it doesn't exist.
	 */
	private getBrowserStoreData(): Define["Information"]["BrowserExtensionStore"][string] | null {
		const storeInfos  = this.status.define.Information.BrowserExtensionStore;
		const browserType = this.getBrowserType();

		if (browserType && Object.hasOwn(storeInfos, browserType)) {
			return storeInfos[browserType];
		}

		return null;
	}

	/**
	 * Gets the link (HTML) to the browser extension store.
	 *
	 * @returns {string} - Anchor tag string, or a message for unofficial browsers.
	 */
	public getBrowserExtensionStoreContent(): string {
		if (this.storeData) {
			return `<a href="${this.storeData.url}" title="${this.storeData.title}" target="_blank" rel="noopener noreferrer">${this.storeData.title}</a>`;
		} else {
			return "There is no official distribution for this browser.";
		}
	}

	/**
	 * Gets the warning message (HTML) when running on an unofficial browser.
	 *
	 * @returns {string} - HTML string of the warning message, or an empty string for official browsers.
	 */
	public getWarningMessage(): string {
		if (!this.storeData) {
			const issues  = `${this.status.define.Information.github.url}/issues`;
			const message = `Your browser is <b>not officially supported</b>, as this extension is intended for Chrome or Firefox. You may encounter <b>unexpected issues</b>. To help us improve compatibility, please let us know what browser you are using via Issues (${issues}).`;
			return `<p id="warning-message-for-supported-browser">${message}</p>`;
		}

		return "";
	}

	/**
	 * Gets the copyright notice (HTML).
	 *
	 * @returns {string} - HTML string of the copyright notice.
	 */
	public getCopyright(): string {
		const store = this.storeData;

		const fromYear = store && Object.hasOwn(store, "publish") && typeof store.publish === "number" ? store.publish : null;
		const thisYear = new Date().getFullYear();
		const lastYear = fromYear && fromYear !== thisYear && thisYear > fromYear ? `-${thisYear}` : "";
		const author   = this.status.define.Information.author;
		const result   = `&copy; ${fromYear}${lastYear} <strong>${author}</strong>.`;

		return result;
	}
}