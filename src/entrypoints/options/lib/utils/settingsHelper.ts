/**
 * Helper functions for the options page.
 *
 * @file
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import Module
import { cloneObject }            from "@/assets/js/lib/CloneObject";
import { SequenceProcessor }      from "@/assets/js/lib/SequenceProcessor";
import { setRootFontSize }        from "@/assets/js/utils/setRootFontSize";
import { logging }                from "@/assets/js/app/logging";
import { patchRules }             from "@/assets/js/app/SequenceProcessor/rules";
import { createMigrationContext } from "@/assets/js/app/SequenceProcessor/context";

// Import Types
import type { Config, Define, Status } from "@/assets/js/types";
import type { SequenceRule }           from "@/assets/js/lib/SequenceProcessor/types";
import type { MigrationContext }       from "@/assets/js/app/SequenceProcessor/types";



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
 * This function applies a series of sequence rules to ensure data integrity and completeness before settings are saved.
 *
 * @param   {Config}                                   config - Current configuration object to be corrected.
 * @param   {Define}                                   define - Definition object containing default settings.
 * @param   {SequenceRule<Config, MigrationContext>[]} rule   - Array of sequence rules to apply.
 * @returns {Promise<Config>}                                   A Promise that resolves to the corrected configuration object.
 */
async function applyPreSaveCorrections(config: Config, define: Define, rule: SequenceRule<Config, MigrationContext>[] = patchRules): Promise<Config> {
	const data      = cloneObject(config);
	const context   = await createMigrationContext(define);
	const processor = new SequenceProcessor(rule);
	const result    = await processor.process(data, context, { failFast: false, cloneFn: cloneObject });

	console.debug("DEBUG(sequence): apply pre save corrections", { result });

	return result.data;
}

/**
 * Generates meta-information (name, version, timestamp) about the current configuration.
 *
 * @returns {Config["Information"]} Meta-information object.
 */
function getInformationOfConfig(): Config["Information"] {
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