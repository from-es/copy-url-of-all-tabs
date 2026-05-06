/**
 * UI language handling.
 *
 * @file
 */

// WXT provided cross-browser compatible API.
// Note: `browser` might not be available in all JS environments.
import { browser } from "wxt/browser";



/**
 * Sets the language attribute of the HTML element based on the browser's UI language.
 * It prioritizes `browser.i18n.getUILanguage()` and falls back to `navigator.language`.
 * Supports "ja" and defaults to "en".
 *
 * @returns {void}
 */
export function setPageLanguage(): void {
	let lang: string;

	try {
		if (typeof browser !== "undefined" && browser.i18n?.getUILanguage) {
			lang = browser.i18n.getUILanguage();
		} else {
			// Fallback for environments where browser.i18n might not be available
			// (e.g., standard web pages, though this project is a browser extension)
			lang = navigator.language || "en"; // Default to 'en' if navigator.language is also unavailable
		}
	} catch {
		// If browser.i18n.getUILanguage() throws or any other error occurs during detection,
		// fallback to navigator.language or default to 'en'.
		lang = navigator.language || "en";
	}

	// Normalize language to just the primary language tag (e.g., "en-US" -> "en")
	// This ensures consistency with the switch cases ("ja", "en")
	const langCode = lang.split("-")[0];
	const elm      = document.querySelector("html");

	if (!elm) {
		return;
	}

	switch (langCode) {
		case "ja":
			elm.setAttribute("lang", "ja");
			break;
		default: // Use the normalized language code directly, or default to 'en' if it's empty
			elm.setAttribute("lang", langCode || "en");
			break;
	}
}