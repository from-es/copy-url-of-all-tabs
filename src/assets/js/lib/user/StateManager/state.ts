/**
 * @file This file provides a typed, shared store instance for state management across the application.
 * Modules can import `shareStatus` for reading state, `updateState` for modifying state,
 * and `initializeSharedState` for setting up the initial state.
 */

// Import Module & Types
import { createStore, type UpdateState } from "@/assets/js/lib/user/StateManager/store.svelte";



// ----------------------------------------------------------------------------------------------------------------------------
// IMPORTANT: Project-specific configurations are defined here.
// This includes:
//   - Type definitions for the shared store (`shareStatus`).
//   - Type definitions for the arguments of `initializeSharedState`.
//   - Type definitions for the arguments of `updateState`.

// Import Types
import type { Config, Define, Status } from "@/assets/js/types";

// Create a store instance with the `Status` type.
const { shareStatus, updateState }: {
	shareStatus: Status;
	updateState: UpdateState;
} = createStore<Status>();

/**
 * Initializes the shared application state.
 * This function should be called at the application's entry point (e.g., in the background script)
 * to set up the initial values for the store.
*
* @param config - The application configuration object.
* @param define - The application's definition object, which is frozen after initialization.
*/
function initializeSharedState(config: Config, define: Define): void {
	updateState([
		{ name: "config", value: config, freeze: false },
		{ name: "define", value: define, freeze: true }
	]);
}
// ----------------------------------------------------------------------------------------------------------------------------



// Export the instantiated store for use in other components.
export { shareStatus, updateState, initializeSharedState };