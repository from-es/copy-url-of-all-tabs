/**
 * Main entry point for the background script.
 *
 * @file
 * @lastModified 2026-04-08
 */

// WXT provided cross-browser compatible API and Types.
import { browser, type Browser } from "wxt/browser";

// Import Module
import { define }           from "@/assets/js/define";  // Pre-import define to avoid messaging errors when it contains non-serializable types.
import { logging }          from "@/assets/js/logging";
import { initializeConfig } from "@/assets/js/initializeConfig";
import { handleOpenURLs }   from "./lib/openUrlsHandler";
import { countManager }     from "./lib/CountManager";
import { badgeController }  from "./lib/BadgeController";

// Import Types
import type { Config }           from "@/assets/js/types";
import type { ExtensionMessage } from "@/assets/js/types";

// eslint-disable-next-line import/exports-last
export default defineBackground({
	// Set manifest options
	persistent: false,
	type      : "module",

	// Executed when background is loaded
	main
});



/**
 * Main entry point for the background script.
 */
function main() {
	initialize();
}

/**
 * Initialize the background script.
 *
 * Registers message listeners and initializes storage and badge counters.
 *
 * @returns {Promise<void>} Promise that resolves when initialization is complete.
 */
async function initialize(): Promise<void> {
	browser.runtime.onMessage.addListener(eventOnMessage);

	await initializeLocalStorage();

	initializeBadgeCounter();
}

/**
 * Initialize local storage when the extension starts.
 *
 * If storage is empty, default settings are saved. If settings already exist, no action is taken.
 *
 * @returns {Promise<void>} Promise that resolves when the local storage has been initialized.
 */
async function initializeLocalStorage(): Promise<void> {
	try {
		await initializeConfig(null, true);

		console.info("INFO(init): Success: initialize configuration on startup");
	} catch (error) {
		console.error("ERROR(init): Failure: initial configuration on startup", error);
	}
}

/**
 * Set up coordination between badge counter functions.
 */
function initializeBadgeCounter() {
	console.info("INFO(badge): initialize badge counter setting");

	// Monitor changes in the count and update the badge text.
	countManager.subscribe((newCount) => {
		badgeController.updateText(String(newCount));
	});

	// Monitor changes in storage and update the badge color.
	browser.storage.onChanged.addListener(handleStorageOnChanged);
}

/**
 * Handle storage changes as a listener for `browser.storage.onChanged`.
 *
 * Specifically monitors changes to the `config` object in the `local` storage area
 * and calls `badgeController.updateColor` to update the badge color.
 *
 * @param   {object} changes  - The object containing the changed storage items.
 * @param   {string} areaName - The name of the storage area where the change occurred (e.g., "local", "sync").
 * @returns {Promise<void>}     Promise that resolves when the change has been handled.
 */
async function handleStorageOnChanged(changes: { [key: string]: Browser.storage.StorageChange }, areaName: string): Promise<void> {
	try {
		if (areaName === "local" && changes.config) {
			// Retrieve the latest configuration via initializeConfig, which handles validation and migration.
			// Pass save: false to prevent redundant save operations within the onChanged listener.
			const { config: updatedConfig } = await initializeConfig(changes.config.newValue as Config | null, false);

			if (updatedConfig && updatedConfig.Badge) {
				badgeController.updateColor(updatedConfig.Badge);
			}
		}
	} catch (error) {
		console.error("ERROR(storage): error in browser.storage.onChanged listener", { error });
	}
}

/**
 * Event handler for `browser.runtime.onMessage`.
 *
 * Handles asynchronous responses by returning a Promise.
 *
 * @param   {ExtensionMessage}              message - Message received from popups or other parts of the extension.
 * @param   {Browser.Runtime.MessageSender} sender  - Information about the sender of the message.
 * @returns {Promise<void | object>}                  The response content or a Promise indicating no response.
 */
async function eventOnMessage(message: ExtensionMessage, sender: Browser.runtime.MessageSender): Promise<void | object> {
	const { config } = message.status;

	// Set logging console for debugging
	logging(config, define);

	console.info("INFO(messaging): receive message from sender", { message, sender });

	switch (message.action) {
		case define.Messaging.OpenURLs:
			return handleOpenURLs(message);
		default:
			return handleDoNotMatchAnySwitchStatement(message, sender);
	}
}

/**
 * Handle cases where the received message action does not match any switch statement.
 *
 * @param   {ExtensionMessage}              message - The received message object.
 * @param   {Browser.Runtime.MessageSender} sender  - Information about the sender of the message.
 * @returns {Promise<object>}                         Promise that resolves to a warning response object.
 */
async function handleDoNotMatchAnySwitchStatement(message: ExtensionMessage, sender: Browser.runtime.MessageSender): Promise<object> {
	const warningMessage = "Warning, Received a message with No Option";

	console.warn("WARN(messaging): received message with no option", { message, sender });

	return {
		message  : warningMessage,
		arguments: { message, sender }
	};
}