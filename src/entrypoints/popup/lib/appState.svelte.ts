/**
 * State management for the popup menu using Svelte Runes.
 *
 * @file
 * @lastModified 2026-04-04
 */

// Import Types
import type { Action, EventOnClickActionResult } from "./types";



/**
 * Type definition for AppState.
 */
type AppState = {
	isLoading    : boolean;
	currentAction: Action | null;
	result       : EventOnClickActionResult | null;
	message      : string | null;
};



/**
 * Returns the default template for the appState object.
 *
 * @returns {AppState} - The default app state.
 */
function getDefaultValueOfAppState(): AppState {
	return {
		isLoading    : false,
		currentAction: null,
		result       : null,
		message      : null
	};
}

/**
 * Returns a template for the result object.
 *
 * @returns {EventOnClickActionResult} - A fresh result template.
 */
function createResultTemplate(): EventOnClickActionResult {
	return {
		action   : null,
		status   : false,
		message  : "",
		judgment : false,
		urlList  : [],
		clipboard: {
			direction: null,
			text     : null
		}
	};
}



/**
 * State management class using Svelte 5 Runes.
 */
class ActionStore {
	#state = $state<AppState>(getDefaultValueOfAppState());

	/**
	 * Current action.
	 */
	get currentAction() {
		return this.#state.currentAction;
	}

	/**
	 * Current action result.
	 */
	get result() {
		return this.#state.result;
	}

	/**
	 * Current notification message.
	 */
	get message() {
		return this.#state.message;
	}

	/**
	 * Whether an action is currently in progress.
	 */
	get isLoading() {
		return this.#state.isLoading;
	}

	/**
	 * Derived properties.
	 */
	get isActionInProgress() {
		return this.#state.isLoading;
	}

	/**
	 * Whether a notification message should be shown.
	 */
	get shouldShowMessage() {
		return this.#state.message !== null;
	}

	/**
	 * Starts an action and updates the state.
	 *
	 * @param {Action | null} action - The action to start.
	 */
	startAction(action: Action | null): void {
		this.#state.isLoading     = true;
		this.#state.currentAction = action;
		this.#state.result        = createResultTemplate();
		this.#state.message       = null;
	}

	/**
	 * Completes an action and updates the state.
	 *
	 * @param {EventOnClickActionResult | null} result - The result of the completed action.
	 */
	completeAction(result: EventOnClickActionResult | null): void {
		this.#state.isLoading     = false;
		this.#state.currentAction = null;
		this.#state.result        = result;
	}

	/**
	 * Sets the UI message in the state.
	 *
	 * @param {string | null} message - The message to set.
	 */
	setMessage(message: string | null): void {
		this.#state.message = message;
	}

	/**
	 * Resets the state to default values.
	 */
	reset(): void {
		const defaultState = getDefaultValueOfAppState();

		this.#state.isLoading     = defaultState.isLoading;
		this.#state.currentAction = defaultState.currentAction;
		this.#state.result        = defaultState.result;
		this.#state.message       = defaultState.message;
	}
}



/**
 * Singleton instance of the ActionStore.
 */
export const actionStore = new ActionStore();