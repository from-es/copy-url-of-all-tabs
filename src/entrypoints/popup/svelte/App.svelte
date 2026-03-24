<script lang="ts">
	/**
	 * Main Svelte component for the popup menu.
	 *
	 * @file
	 * @lastModified 2026-03-24
	 */

	// WXT provided cross-browser compatible API.
	import { browser } from "wxt/browser";

	// Import Svelte
	import { onMount } from "svelte";

	// Import Module
	import { initializeConfig }                                             from "@/assets/js/initializeConfig";
	import { cloneObject }                                                  from "@/assets/js/lib/user/CloneObject";
	import { sanitizeForSendMessage }                                       from "@/assets/js/utils/sanitizeForSendMessage";
	import { createSafeHTML }                                               from "@/assets/js/utils/setSafeHTML";
	import { appState, actionStore, isActionInProgress, shouldShowMessage } from "./appState";
	import { eventActionCopy, eventActionPaste }                            from "./userActions";

	// Import Object
	import { shareStatus as status } from "@/assets/js/lib/user/StateManager/state";  // Shared State Object

	// Import Types
	import type { Config, Define, ExtensionMessage } from "@/assets/js/types/";
	import type { Action, EventOnClickActionResult } from "./types";



	onMount(() => {
		console.info("INFO(popup): Popup component mounted");
		console.debug("DEBUG(popup): initial status object", { status: cloneObject(status) }); // Deep copy the status object to avoid Svelte errors caused by non-cloneable types (functions) within the status structure

		initialize();
	});

	/**
	 * Initializes the popup menu.
	 */
	function initialize(): void {
		// Dynamic update of styles (popup.css >> :root element)
		const fontSize = status.config.PopupMenu.fontsize;
		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);

		console.info("INFO(popup): Popup component initialized");
	}

	/**
	 * Handler for button click events.
	 * Executes the corresponding action based on the data-action attribute.
	 *
	 * @param {MouseEvent} event - Mouse click event object.
	 * @returns {Promise<void>}
	 */
	async function eventOnClick(event: MouseEvent): Promise<void> {
		const self               = event.currentTarget;
		const { config, define } = await initializeConfig(null);                                               // Measure for when options are changed while the popup menu is open -> calling again from the popup menu @2024/10/18
		const action             = self ? (self as HTMLElement).getAttribute("data-action") as Action : null;  // Action to execute >> "copy" or "paste" or "options"
		let   result: EventOnClickActionResult | null = null;

		// Delegate state management to appState
		actionStore.startAction(action);

		try {
			result = await handleAction(action, config, define);
		} catch (error) {
			result = createErrorResult(action, error as Error);

			console.error("ERROR(action): action execution failed", { action, error });
		} finally {
			// Notify action completion
			actionStore.completeAction(result);

			console.debug("DEBUG(action): action and result", { action, result });
		}

		// Post-processing for "paste" action
		if ( action === "paste" && result && result.judgment && result.urlList?.length > 0 ) {
			const urlList          = result.urlList;
			const extensionMessage = {
				action : status.define.Messaging.OpenURLs,
				address: {
					from: "popup.js",
					to  : "background.js"
				},
				status: {
					config: status.config,
					define: status.define
				},
				argument: {
					urlList: urlList,
					option : config
				}
			};

			openURLs(extensionMessage);
		}

		// Display message
		showMessage(action, result, config);

		// Close popup menu
		closePopupMenu(config.PopupMenu.OnClickClose);
	}

	/**
	 * Opens the extension's options page.
	 * Closes the popup menu shortly after opening the page.
	 *
	 * @returns {Promise<void>}
	 */
	async function eventOpenOptionsPage(): Promise<void> {
		browser.runtime.openOptionsPage();

		const delay = 500; // milliseconds
		window.setTimeout(() => { window.close(); }, delay);
	}

	/**
	 * Fallback processing when no action matches.
	 * Generates a result object containing an error message.
	 *
	 * @param   {Action | null}            action - The action that was not executed.
	 * @returns {EventOnClickActionResult}          Result object containing error information.
	 */
	function eventDoNotMatch(action: Action | null): EventOnClickActionResult {
		const message = `Error, Do not match any switch statement. >> eventOnClick() >> ${action}`;
		const result: EventOnClickActionResult  = {
			action,
			status   : false,
			message  : message,
			judgment : false,
			urlList  : [],
			clipboard: { direction: null, text: null }
		};

		console.error("ERROR(action): do not match any switch statement", { message });

		return result;
	}

	/**
	 * Calls the corresponding event processing function based on the passed action.
	 *
	 * @param   {Action | null}                            action - The action to execute.
	 * @param   {Config}                                   config - Extension configuration object.
	 * @param   {Define}                                   define - Extension definition object.
	 * @returns {Promise<EventOnClickActionResult | null>}          Execution result of the action. Returns null for the 'options' action.
	 */
	async function handleAction(action: Action | null, config: Config, define: Define): Promise<EventOnClickActionResult | null> {
		let result: EventOnClickActionResult | null = null;

		switch (action) {
			case "copy":
				result = await eventActionCopy(action, config, define);
				break;
			case "paste":
				result = await eventActionPaste(action, config, define);
				break;
			case "options":
				eventOpenOptionsPage();
				break;
			default:
				result = eventDoNotMatch(action);
		}

		return result;
	}

	/**
	 * Generates an error result object if an error occurs during action execution.
	 *
	 * @param   {Action | null}            action - The action where the error occurred.
	 * @param   {Error}                    error  - The error object that occurred.
	 * @returns {EventOnClickActionResult}          Result object containing error information.
	 */
	function createErrorResult(action: Action | null, error: Error): EventOnClickActionResult {
		let message = "An error occurred during the operation.";

		if (error instanceof Error && error?.message) {
			message += ` ${error.message}`;
		}

		return {
			action,
			status   : false,
			message  : message,
			judgment : false,
			urlList  : [],
			clipboard: { direction: null, text: null }
		};
	}

	/**
	 * Sends a message to the background script to open the specified list of URLs in new tabs.
	 *
	 * @param {ExtensionMessage} message - Message object containing the list of URLs to open and settings.
	 */
	function openURLs(message: ExtensionMessage): void {
		// Sanitize the object before sending for Firefox compatibility and safety >> remove properties not supported by the structured clone algorithm
		const options = {
			checkOnly: false,
			debug    : false
		};
		const sanitizedMessage = sanitizeForSendMessage(message, options);

		// Open tabs in background.js because opening in the active tab moves focus and closes the popup menu, which might terminate the process prematurely @2024/10/13
		browser.runtime.sendMessage(sanitizedMessage);
	}

	/**
	 * Displays a message in the UI based on the action result.
	 *
	 * @param {Action | null}                   action - The action that was executed.
	 * @param {EventOnClickActionResult | null} result - Action result object.
	 * @param {Config}                          config - Extension configuration object.
	 */
	function showMessage(action: Action | null, result: EventOnClickActionResult | null, config: Config): void {
		const message = createMessage(action, result);
		const option  = config.PopupMenu.ClearMessage;

		if ( !message ) {
			return;
		}

		actionStore.setMessage(message);

		if ( !$shouldShowMessage ) {
			return;
		}

		clearMessage(message, option);
	}

	/**
	 * Generates an HTML message string for display in the UI from the action result.
	 *
	 * @param   {Action | null}                   action - The action that was executed.
	 * @param   {EventOnClickActionResult | null} result - Action result object.
	 * @returns {string | null}                            Generated HTML string. Returns null if there is no result.
	 */
	function createMessage(action: Action | null, result: EventOnClickActionResult | null): string | null {
		if ( !result || !result?.message ) {
			console.debug("DEBUG(ui): message is null, undefined, or empty", { action, result });

			return null;
		}

		const { judgment, message } = result;

		const attr     = judgment ? "success" : "error";
		const preamble = judgment ? `success` : `error`;
		const body     = message;
		const html     = message ? `<p class="${attr}"><span>${preamble}</span>, <span>${action}</span> action.</p><p class="${attr}">${body}</p>` : null;

		return html;
	}

	/**
	 * Clears the displayed message after the configured timeout.
	 *
	 * @param {string}                              message - The displayed message string.
	 * @param {Config["PopupMenu"]["ClearMessage"]} option  - Settings regarding message clearing.
	 */
	function clearMessage(message: string, option: Config["PopupMenu"]["ClearMessage"]): void {
		if ( !message || !(typeof message === "string") || !(message.length > 0) ) {
			console.error("ERROR(ui): Invalid: argument passed to showMessage, message invalid", { message });

			return;
		}
		if ( !option ) {
			console.error("ERROR(ui): Invalid: argument passed to showMessage, option invalid", { option });

			return;
		}
		if ( !(Object.hasOwn(option, "enable") && typeof option?.enable === "boolean") ) {
			console.error("ERROR(ui): Invalid: argument passed to showMessage, option enable invalid", { enable: option?.enable });

			return;
		}
		if ( !(Object.hasOwn(option, "timeout") && typeof option.timeout === "number" && option.timeout >= 0) ) {
			console.error("ERROR(ui): Invalid: argument passed to showMessage, option timeout invalid", { timeout: option?.timeout });

			return;
		}

		const { enable: clear, timeout: delay } = option;

		if ( clear ) {
			window.setTimeout(() => { actionStore.setMessage(""); }, delay * 1000);
		}
	}

	/**
	 * Closes the popup menu after the configured timeout.
	 *
	 * @param {Config["PopupMenu"]["OnClickClose"]} option - Settings regarding the behavior of closing the popup menu.
	 */
	function closePopupMenu(option: Config["PopupMenu"]["OnClickClose"]): void {
		const { enable: close, timeout: delay } = option;

		if ( !(typeof close === "boolean") || !(typeof delay === "number" && delay >= 0) ) {
			console.error("ERROR(ui): Invalid: argument passed to closePopupMenu, option invalid", { option });

			return;
		}

		if ( close ) {
			window.setTimeout(() => { window.close(); }, delay * 1000);

			console.debug("DEBUG(ui): close popup menu", { close, delay });
		}
	}
</script>



{#snippet button(attr: { action: Action; label: string; text: string; disabled: boolean })}
	<button
		class       = "text"
		type        = "button"
		aria-label  = { attr.label }
		data-action = { attr.action }
		disabled    = { attr.disabled }
		onclick     = { eventOnClick }
	>
		{ attr.text }
	</button>
{/snippet}



<main>
	<section id="action">
		<ul>
			<li id="copy" class="menu">
				{@render button(
					{
						action  : "copy",
						label   : "Copy URLs of all tabs to clipboard",
						text    : ($isActionInProgress && $appState.currentAction === "copy") ? "Copying..." : "Copy",
						disabled: $isActionInProgress
					}
				)}
			</li>
			<li id="paste" class="menu">
				{@render button(
					{
						action  : "paste",
						label   : "Open URLs from clipboard in new tabs",
						text    : ($isActionInProgress && $appState.currentAction === "paste") ? "Pasting..." : "Paste",
						disabled: $isActionInProgress
					}
				)}
			</li>
		</ul>
	</section>

	<section id="toolbar" class="separator">
		<ul>
			<li id="option" class="menu">
				{@render button(
					{
						action  : "options",
						label   : "Open extension options page",
						text    : "Options",
						disabled: $isActionInProgress
					}
				)}
			</li>
		</ul>
	</section>

	<section id="message" aria-live="polite">
		{#if $shouldShowMessage}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html createSafeHTML($appState.message)}
		{/if}
	</section>
</main>



<style>
</style>