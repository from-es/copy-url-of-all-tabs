<script lang="ts">
	/**
	 * Main Svelte component for the popup menu.
	 *
	 * @file
	 * @lastModified 2026-04-18
	 */

	// WXT provided cross-browser compatible API.
	import { browser } from "wxt/browser";

	// Import Svelte
	import { onMount } from "svelte";

	// Import Svelte Module
	import { actionStore } from "./appState.svelte.ts";

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/lib/user/StateManager/state.svelte.ts";  // Shared State Object

	// Import Module
	import { initializeConfig }                  from "@/assets/js/initializeConfig";
	import { cloneObject }                       from "@/assets/js/lib/user/CloneObject";
	import { sanitizeForSendMessage }            from "@/assets/js/utils/sanitizeForSendMessage";
	import { createSafeHTML }                    from "@/assets/js/utils/setSafeHTML";
	import { eventActionCopy, eventActionPaste } from "./userActions";

	// Import Types
	import type { Config, Define, ExtensionMessage, SetTimeoutHandle } from "@/assets/js/types";
	import type { Action, EventOnClickActionResult }                   from "./types";



	/**
	 * Variable for managing the timer ID to control the display duration
	 * of notification messages at the bottom of the popup.
	 */
	let messageTimerId: SetTimeoutHandle = undefined;

	onMount(() => {
		console.info("INFO(popup): Popup component mounted");
		console.debug("DEBUG(popup): initial status object", { status: cloneObject(status) });  // Deep copy the status object to avoid Svelte errors caused by non-cloneable types (functions) within the status structure

		initialize();
	});

	/**
	 * Initializes the popup menu.
	 *
	 * @returns {void}
	 */
	function initialize(): void {
		setFontSizeForPage(status.config.PopupMenu.fontsize);

		console.info("INFO(popup): Popup component initialized");
	}

	/**
	 * Dynamically applies the base font size of the page based on settings.
	 *
	 * Dynamic update of styles (:root element)
	 *
	 * @returns {void}
	 */
	function setFontSizeForPage(fontSize: number): void {
		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
	}

	/**
	 * Handler for button click events.
	 * Executes the corresponding action based on the data-action attribute.
	 *
	 * @param   {MouseEvent}    event - Mouse click event object.
	 * @returns {Promise<void>}
	 */
	async function eventOnClick(event: MouseEvent): Promise<void> {
		const self                                    = event.currentTarget;
		const { config, define }                      = await initializeConfig(null);                                               // Measure for when options are changed while the popup menu is open -> calling again from the popup menu @2024/10/18
		const action                                  = self ? (self as HTMLElement).getAttribute("data-action") as Action : null;  // Action to execute >> "copy" or "paste" or "options"
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
		if (action === "paste" && result && result.judgment && Array.isArray(result.urlList) && result.urlList?.length > 0) {
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
		messageController(action, result, config);

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

		const delay = 500;  // milliseconds
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
		const message = `Error, Does not match any switch statement. >> eventOnClick() >> ${action}`;
		const result: EventOnClickActionResult = {
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
	 * @param   {ExtensionMessage} message - Message object containing the list of URLs to open and settings.
	 * @returns {void}
	 */
	function openURLs(message: ExtensionMessage): void {
		/**
		 * To ensure Firefox compatibility and safety, the object must be sanitized (removing properties
		 * not supported by the structured clone algorithm) before sending.
		 *
		 * @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
		 */
		const options = {
			checkOnly: false,
			debug    : false
		};

		try {
			const sanitizedMessage = sanitizeForSendMessage(message, options);

			// Open tabs in background.js because opening in the active tab moves focus and closes the popup menu,
			// which might terminate the process prematurely.
			browser.runtime.sendMessage(sanitizedMessage);
		} catch (error) {
			console.error("ERROR(popup): failed to sanitize message for openURLs", { message, error });
		}
	}

	/**
	 * Displays a message in the UI based on the action result.
	 *
	 * @param   {Action | null}                   action - The action that was executed.
	 * @param   {EventOnClickActionResult | null} result - Action result object.
	 * @param   {Config}                          config - Extension configuration object.
	 * @returns {void}
	 */
	function messageController(action: Action | null, result: EventOnClickActionResult | null, config: Config): void {
		/**
		 * Validates the arguments passed to the messageController.
		 *
		 * @param   {Action | null} action - The action that was executed.
		 * @param   {Config}        config - Extension configuration object.
		 * @returns {boolean}                True if the arguments are valid, false otherwise.
		 */
		const validateArguments = (action: Action | null, config: Config): boolean => {
			const option       = config?.PopupMenu?.ClearMessage;
			const regex_action = /^(copy|paste|options)$/;

			// action
			if (!action || !regex_action.test(action)) {
				console.error("ERROR(ui): Invalid: argument 'action' passed to MessageController is invalid", { action });
				return false;
			}

			// config: config.PopupMenu.ClearMessage
			if (!config || !(typeof config === "object" && !Array.isArray(config))) {
				console.error("ERROR(ui): Invalid: argument 'config' passed to MessageController is not an object", { config });
				return false;
			}
			if (!(Object.hasOwn(config, "PopupMenu") && typeof config.PopupMenu === "object" && config.PopupMenu !== null)) {
				console.error("ERROR(ui): Invalid: property 'config.PopupMenu' is missing or not an object", { config });
				return false;
			}
			if (!(Object.hasOwn(config.PopupMenu, "ClearMessage") && typeof config.PopupMenu.ClearMessage === "object" && config.PopupMenu.ClearMessage !== null)) {
				console.error("ERROR(ui): Invalid: property 'config.PopupMenu.ClearMessage' is missing or not an object", { config });
				return false;
			}
			if (!(Object.hasOwn(config.PopupMenu.ClearMessage, "enable") && Object.hasOwn(config.PopupMenu.ClearMessage, "timeout"))) {
				console.error("ERROR(ui): Invalid: properties 'enable' or 'timeout' are missing in 'config.PopupMenu.ClearMessage'", { config });
				return false;
			}

			// option: config.PopupMenu.ClearMessage
			if (!option || !(typeof option === "object" && !Array.isArray(option))) {
				console.error("ERROR(ui): Invalid: argument 'config.PopupMenu.ClearMessage' passed to MessageController is invalid", { option });
				return false;
			}
			if (!(Object.hasOwn(option, "enable") && typeof option.enable === "boolean")) {
				console.error("ERROR(ui): Invalid: property 'config.PopupMenu.ClearMessage.enable' is invalid", { enable: option?.enable });

				return false;
			}
			if (!(Object.hasOwn(option, "timeout") && typeof option.timeout === "number" && option.timeout >= 0)) {
				console.error("ERROR(ui): Invalid: property 'config.PopupMenu.ClearMessage.timeout' is invalid", { timeout: option?.timeout });
				return false;
			}

			return true;
		};

		/**
		 * Updates the message text in the action store.
		 *
		 * @param {string} message - The message to display.
		 */
		const setMessageText = (message: string): void => {
			actionStore.setMessage(message);
		};

		/**
		 * Sets or clears the timer to hide the notification message.
		 *
		 * @param {Config["PopupMenu"]["ClearMessage"]} option - Settings regarding the behavior of clearing the message.
		 */
		const setMessageClearTimer = (option: typeof config.PopupMenu.ClearMessage): void => {
			const { enable: clear, timeout: delay } = option;

			// To prevent race conditions from overlapping timer processes,
			// if a previous timer ID exists, reset the ID and clear the previous timer,
			// ensuring only the last triggered timer is active.
			if (messageTimerId) {
				window.clearTimeout(messageTimerId);
				messageTimerId = undefined;
			}

			if (clear) {
				messageTimerId = scheduleMessageClear(delay);
			}
		};

		const isValid = validateArguments(action, config);
		if (!isValid) {
			return;
		}

		const message            = createMessage(action, result);
		const clearMessageOption = config.PopupMenu.ClearMessage;

		// No further processing is required if the message is empty.
		if (!message || !(typeof message === "string" && message.length > 0)) {
			return;
		}

		// Writing to the store updates shouldShowMessage to true, so it must be done before the evaluation.
		setMessageText(message);

		if (!actionStore.shouldShowMessage) {
			return;
		}

		// Execute in conjunction with the message display process.
		setMessageClearTimer(clearMessageOption);
	}

	/**
	 * Generates an HTML message string for display in the UI from the action result.
	 *
	 * @param   {Action | null}                   action - The action that was executed.
	 * @param   {EventOnClickActionResult | null} result - Action result object.
	 * @returns {string | null}                            Generated HTML string. Returns null if there is no result.
	 */
	function createMessage(action: Action | null, result: EventOnClickActionResult | null): string | null {
		if (!result || !(typeof result.message === "string" && result.message.length > 0)) {
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
	 * @param   {number}           delay - Delay time until the message is cleared (in seconds).
	 * @returns {SetTimeoutHandle}         Timer ID of the scheduled message clear. Returns undefined if validation fails.
	 */
	function scheduleMessageClear(delay: number): SetTimeoutHandle {
		if (!(typeof delay === "number" && delay >= 0)) {
			console.error("ERROR(ui): Invalid: argument passed to clearMessage, delay invalid", { delay });

			return;
		}

		return window.setTimeout(
			() => {
				actionStore.setMessage("");
				messageTimerId = undefined;  // Reset the ID after execution is complete.
			},
			delay * 1000
		);
	}

	/**
	 * Closes the popup menu after the configured timeout.
	 *
	 * @param   {Config["PopupMenu"]["OnClickClose"]} option - Settings regarding the behavior of closing the popup menu.
	 * @returns {void}
	 */
	function closePopupMenu(option: Config["PopupMenu"]["OnClickClose"]): void {
		const { enable: close, timeout: delay } = option;
		const isValid                           = (typeof close === "boolean") && (typeof delay === "number" && delay >= 0);

		if (!isValid) {
			console.error("ERROR(ui): Invalid: argument passed to closePopupMenu, option invalid", { option });

			return;
		}

		if (close) {
			window.setTimeout(() => { window.close(); }, delay * 1000);

			console.debug("DEBUG(ui): close popup menu", { close, delay });
		}
	}
</script>



{#snippet button(attr: { action: Action; label: string; text: string; disabled: boolean })}
	<!--
		@snippet button
		@param {Object}  attr          - Button attributes.
		@param {Action}  attr.action   - Action to execute on click.
		@param {string}  attr.label    - Accessible label for the button (aria-label).
		@param {string}  attr.text     - Display text of the button.
		@param {boolean} attr.disabled - Whether the button is disabled.
	-->
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



<svelte:head>
	<title>Popup - { status.define.Information.name }</title>
</svelte:head>



<main>
	<section id="action">
		<ul>
			<li id="copy" class="menu">
				{@render button(
					{
						action  : "copy",
						label   : "Copy URLs of all tabs to clipboard",
						text    : (actionStore.isActionInProgress && actionStore.currentAction === "copy") ? "Copying..." : "Copy",
						disabled: actionStore.isActionInProgress
					}
				)}
			</li>
			<li id="paste" class="menu">
				{@render button(
					{
						action  : "paste",
						label   : "Open URLs from clipboard in new tabs",
						text    : (actionStore.isActionInProgress && actionStore.currentAction === "paste") ? "Pasting..." : "Paste",
						disabled: actionStore.isActionInProgress
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
						disabled: actionStore.isActionInProgress
					}
				)}
			</li>
		</ul>
	</section>

	<section id="message" aria-live="polite">
		{#if actionStore.shouldShowMessage && typeof actionStore.message === "string"}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html createSafeHTML(actionStore.message)}
		{/if}
	</section>
</main>



<style>
</style>