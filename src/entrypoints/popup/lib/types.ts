/**
 * Type definitions for the popup entrypoint.
 *
 * @file
 * @lastModified 2026-04-04
 */

/**
 * Represents the available actions in the popup menu.
 */
type Action = "copy" | "paste" | "options";

/**
 * Core part of the result object.
 */
type ResultCore = {
	/** The message to be displayed to the user. */
	message: string;
	/** Whether the action was considered successful. */
	judgment: boolean;
	/** The list of URLs involved in the action. */
	urlList: string[];
};

/**
 * Generic result type used in App.svelte, appState.svelte.ts, etc.
 */
type EventOnClickActionResult = ResultCore & {
	/** The action that was performed. */
	action: Action | null;
	/** Status of the action execution. */
	status: string | boolean;
	/** Clipboard information. */
	clipboard: {
	/** The direction of the clipboard operation (e.g., "copy", "paste"). */
	direction: string | null;
	/** The text content of the clipboard. */
	text: string | null;
	};
};

/**
 * Type of the result returned by event handlers, with confirmed properties.
 */
type ConcreteResult = ResultCore & {
	/** The action that was performed. */
	action: Action;
	/** Clipboard information. */
	clipboard: {
	/** The direction of the clipboard operation. */
	direction: string;
	/** The text content of the clipboard. */
	text: string;
	};
};

/**
 * Result of the copy action.
 */
type EventActionCopyResult = ConcreteResult & {
	/** Whether the copy action was successful. */
	status: boolean;
};

/**
 * Result of the paste action.
 */
type EventActionPasteResult = ConcreteResult & {
	/** Status of the paste action. */
	status: string | boolean;
};



export {
	Action,
	EventOnClickActionResult,
	EventActionCopyResult,
	EventActionPasteResult
};