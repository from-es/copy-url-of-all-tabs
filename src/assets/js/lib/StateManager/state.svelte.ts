/**
 * Provides a type-safe store instance shared throughout the application.
 *
 * Modules can import `shareStatus` to read state, `updateState` to modify state,
 * and use `initializeSharedState` to set up the initial state.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-04
 */

// Import Module & Types
import { createStore, type UpdateState } from "@/assets/js/lib/StateManager/store.svelte.ts";

// ----------------------------------------------------------------------------------------------------------------------------
// IMPORTANT: Project-specific configurations are defined here.
// This includes:
//   - Type definitions for the shared store (`shareStatus`).
//   - Type definitions for the arguments of `initializeSharedState`.
//   - Type definitions for the arguments of `updateState`.

// Import Types
import type { Config, Define, Status } from "@/assets/js/types";



/**
 * The reactive proxy object representing the shared application state.
 */
const { shareStatus, updateState }: {
	shareStatus: Status;
	updateState: UpdateState;
} = createStore<Status>();

/**
 * Initializes the shared application state.
 * This function should be called at the application's entry point (e.g., in the background script)
 * to set up the initial values for the store.
 *
 * @param   {Config} config - The application configuration object.
 * @param   {Define} define - The application's definition object, which is frozen after initialization.
 * @returns {void}
 */
function initializeSharedState(config: Config, define: Define): void {
	updateState([
		{ name: "config", value: config, freeze: false },
		{ name: "define", value: define, freeze: true }
	]);
}
// ----------------------------------------------------------------------------------------------------------------------------



// Export the instantiated store for use in other components.
export {
	shareStatus,

	updateState,
	initializeSharedState
};