/**
 * User-initiated action handlers for the popup menu.
 *
 * @file
 * @lastModified 2026-03-29
 */

// WXT provided cross-browser compatible API and Types.
import { browser, type Browser } from "wxt/browser";

// Import Module
import { ClipboardManager }                            from "@/assets/js/lib/user/ClipboardManager";
import { FormatManager }                               from "../js/FormatManager";
import { prepareForActionCopy, prepareForActionPaste } from "./filtering";

// Import Types
import type { Config, Define }                                        from "@/assets/js/types/";
import type { Action, EventActionCopyResult, EventActionPasteResult } from "./types";



/**
 * Gets URLs of all tabs, filters and formats them based on settings, and then sends them to the clipboard.
 *
 * @param   {Action}                         action - Action string to execute (e.g., "copy").
 * @param   {Config}                         config - User configuration object.
 * @param   {Define}                         define - Predefined constant object.
 * @returns {Promise<EventActionCopyResult>}          Object containing the copy result and status.
 */
async function eventActionCopy(action: Action, config: Config, define: Define): Promise<EventActionCopyResult> {
	const rawTabs  = await getAllTabs();
	const tabs     = prepareForActionCopy(rawTabs, action, config, define);
	const type     = config.Format.type;
	const template = config.Format.template;
	const mimetype = (config.Format.type === "custom" && config.Format?.mimetype) ? config.Format.mimetype : "text/plain";
	const sanitize = (mimetype === "text/html");  // Apply HTML escape only when the output format is text/html

	// Format and write to clipboard
	const text   = FormatManager.format(tabs, type, template, sanitize);
	const status = await ClipboardManager.write(text, mimetype);

	const num    = tabs.length;
	const result = {
		action   : action,
		status   : status,
		message  : status ? (num ? `${num} URLs copied !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment : status ? true : false,
		urlList  : [],
		clipboard: {
			direction: "From Tabs to Clipboard",
			text     : text
		}
	};

	return result;
}

/**
 * Pre-processing that extracts URLs from the clipboard and filters them based on settings.
 *
 * @param   {Action}                          action - Action string to execute (e.g., "paste").
 * @param   {Config}                          config - User configuration object.
 * @param   {Define}                          define - Predefined constant object.
 * @returns {Promise<EventActionPasteResult>}          Object containing the paste result and status.
 */
async function eventActionPaste(action: Action, config: Config, define: Define): Promise<EventActionPasteResult> {
	const regexSearch     = config.Search.regex;
	const regexUrlPattern = define.Regex.url.RFC3986LooseWithAuth;

	const status   = await ClipboardManager.readText();
	const text     = (typeof status === "string") ? status : "";
	const rawList  = getUrlList(text, regexSearch, regexUrlPattern);
	const urlList  = prepareForActionPaste(rawList, action, config, define);
	const urlCount = (urlList && Array.isArray(urlList) && urlList?.length) ? urlList.length : null;

	const result = {
		action   : action,
		status   : (typeof status === "string"),
		message  : (typeof status === "string") ? ((urlCount && typeof urlCount === "number" && urlCount > 0) ? `${urlCount} URLs open !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment : (status && urlCount) ? true : false,
		urlList  : urlList,
		clipboard: {
			direction: "From Clipboard to Tabs",
			text     : text
		}
	};

	return result;
}

/**
 * Gets all tab information from the current window.
 *
 * @returns {Promise<Browser.tabs.Tab[]>} - An array of tab objects.
 */
async function getAllTabs(): Promise<Browser.tabs.Tab[]> {
	try {
		const queryInfo = { currentWindow : true };             // Limit acquisition target to tabs in the current window.
		const tabs      = await browser.tabs.query(queryInfo);  // tabs.query() (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query)

		return tabs;
	} catch (error) {
		console.error("ERROR(tab): Exception: failed to get tabs", { error });

		return [];
	}
}

/**
 * Gets a list of URLs from a string.
 *
 * @param   {string}  text            - Text obtained from the clipboard, etc.
 * @param   {boolean} regexSearch     - Whether to search for URLs using regular expressions.
 * @param   {RegExp}  regexUrlPattern - Regular expression pattern for URL extraction.
 * @returns {string[]}                  Array of URL strings.
 */
function getUrlList(text: string, regexSearch: boolean, regexUrlPattern: RegExp): string[] {
	const isValidUrlString = (str: string) => {
		if ( !str || typeof str !== "string" ) {
			return false;
		}

		const trimmedURL = str.trim();

		if ( !(typeof trimmedURL === "string" && trimmedURL.length) ) {
			return false;
		}

		return URL.canParse(trimmedURL);
	};

	const array = regexSearch ? (text).match(regexUrlPattern) : text.split("\n");

	if ( !array || !Array.isArray(array)) {
		return [];
	}

	// Removal of empty arrays or non-URL strings.
	const result = (array).filter(
		(elm) => { return  isValidUrlString(elm); }
	);

	return result;
}



export {
	eventActionCopy,
	eventActionPaste
};