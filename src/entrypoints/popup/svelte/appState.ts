/**
 * State management for the popup menu using Svelte stores.
 *
 * @file
 * @lastModified 2026-03-24
 */

// Import Svelte
import { writable, derived } from "svelte/store";

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
 * Initialization of variables for popup menu state management.
 */
const appState = writable<AppState>(getDefaultValueOfAppState());

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
};

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
};

/**
 * Methods for popup menu state management.
 */
const actionStore = {
	/**
	 * Starts an action and updates the state.
	 *
	 * @param {Action | null} action - The action to start.
	 */
	startAction: (action: Action | null) => {
		appState.update(
			(state) => {
				return {
					// Spread current state
					...state,

					// Overwrite properties
					isLoading    : true,
					currentAction: action,
					result       : createResultTemplate(),
					message      : null
				};
			}
		);
	},

	/**
	 * Completes an action and updates the state.
	 *
	 * @param {EventOnClickActionResult | null} result - The result of the completed action.
	 */
	completeAction: (result: EventOnClickActionResult | null) => {
		appState.update((state) => {
			return {
				// Spread current state
				...state,

				// Overwrite properties
				isLoading    : false,
				currentAction: null,
				result       : result
			};
		});
	},

	/**
	 * Sets the UI message in the state.
	 *
	 * @param {string | null} message - The message to set.
	 */
	setMessage: (message: string | null) => {
		appState.update((state) => {
			return {
				// Spread current state
				...state,

				// Overwrite properties
				message: message
			};
		});
	},

	/**
	 * Resets the state to default values.
	 */
	reset: () => {
		appState.set(getDefaultValueOfAppState());
	}
};

/**
 * Derived store indicating if an action is currently in progress.
 */
const isActionInProgress = derived(
	appState,
	($appState) => {
		return $appState.isLoading;
	}
);

/**
 * Derived store indicating if a message should be shown.
 */
const shouldShowMessage = derived(
	appState,
	($appState) => {
		return ($appState.message !== null);
	}
);



export {
	appState,
	actionStore,
	isActionInProgress,
	shouldShowMessage
};