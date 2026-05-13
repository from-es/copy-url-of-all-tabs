/**
 * Helper functions for the options page.
 *
 * @file
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import Module
import { cloneObject }      from "@/assets/js/lib/CloneObject";
import { MigrationManager } from "@/assets/js/lib/MigrationManager";
import { setRootFontSize }  from "@/assets/js/utils/setRootFontSize";
import { logging }          from "@/assets/js/app/logging";

// Import Types
import type { Config, Define, Status } from "@/assets/js/types";
import type { MigrationRule }          from "@/assets/js/lib/MigrationManager/types";



/**
 * Re-initializes the UI settings. Re-applies logging settings and font size.
 *
 * @param   {Status} status - Application state object.
 * @returns {void}
 */
function reInitialize(status: Status): void {
	const { config, define } = status;

	logging(config, define);

	setRootFontSize(status.config.OptionsPage.fontsize);
}

/**
 * Applies corrections to the config before saving.
 * This function applies a series of migration rules to ensure data integrity and completeness before settings are saved.
 *
 * @param   {Config}                  config - Current configuration object to be corrected.
 * @param   {Define}                  define - Definition object containing default settings.
 * @param   {MigrationRule<Config>[]} rule   - Array of migration rules to apply.
 * @returns {Promise<Config>}                  A Promise that resolves to the corrected configuration object.
 */
async function applyPreSaveCorrections(config: Config, define: Define, rule: MigrationRule<Config>[]): Promise<Config> {
	const data             = cloneObject(config);
	const defaultValues    = cloneObject(define.Config);
	const migrationManager = new MigrationManager(rule);
	const migrationResult  = await migrationManager.migrate(data, defaultValues, { failFast: false });
	const result           = migrationResult.isSucceeded ? migrationResult.data : cloneObject(config);

	console.debug("DEBUG(migration): apply pre save corrections", { migrationResult });

	return result;
}

/**
 * Generates meta-information (name, version, timestamp) about the current configuration.
 *
 * @returns {{ name: string | null; version: string | null; date: { timestamp: number | null; iso8601: string | null; } }} Meta-information object.
 */
function getInformationOfConfig(): { name: string | null; version: string | null; date: { timestamp: number | null; iso8601: string | null; } } {
	const manifest = browser.runtime.getManifest();
	const now      = Date.now();

	const result = {
		name   : manifest.name,
		version: manifest.version,
		date   : {
			timestamp: now,
			iso8601  : new Date(now).toISOString()
		}
	};

	return result;
}

/**
 * Gets a comma-separated list of supported Chromium-based browser names.
 *
 * @param   {Status} status - Application state object.
 * @returns {string}          String containing the list of browser names.
 */
function getChromiumBasedBrowserList(status: Status): string {
	const list = status.define.ChromiumBasedBrowser;
	const text = (list).join(", ");

	return text;
}

/**
 * Temporarily disables the specified HTML element, primarily used for anti-spam (preventing repeated clicks).
 *
 * @param   {HTMLElement} element  - The HTML element to disable.
 * @param   {number}      duration - Duration of disablement in milliseconds.
 * @returns {void}
 */
function disableElementTemporarily(element: HTMLElement, duration: number): void {
	const hasDisabledProperty = (element instanceof HTMLElement && "disabled" in element);  // Only disable HTML elements that have a "disabled" property >> (HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement)
	const isValidNumber       = (typeof duration === "number" && duration > 0);

	if ( !(hasDisabledProperty && isValidNumber) ) {
		return;
	}

	element.setAttribute("disabled", "true");
	setTimeout((elm) => { elm.removeAttribute("disabled"); }, duration, element);
}

/**
 * Returns a notification message for paste-related filtering.
 *
 * @returns {string} HTML string of the notification message.
 */
function showNoticeMessageForPaste(): string {
	const message = `<p class="notice-paste"><span class="notice-highlight">Notice</span>: If <b>Search URL of the text in the clipboard</b> option is enabled, filtering is only valid for "http & https" items.</p>`;

	return message;
}



export {
	reInitialize,
	applyPreSaveCorrections,
	getInformationOfConfig,
	getChromiumBasedBrowserList,
	disableElementTemporarily,
	showNoticeMessageForPaste
};