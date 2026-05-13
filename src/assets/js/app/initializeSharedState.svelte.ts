/**
 * Provides a type-safe store instance shared throughout the application.
 *
 * This module specializes the generic StateManager for this application's specific
 * state structure (Config and Define).
 *
 * @file
 * @author       From E
 * @lastModified 2026-05-04
 */

// Import Module & Types
import { createStore, type StateOption } from "@/assets/js/lib/StateManager/store.svelte.ts";

// Import Types
import type { Config, Define, Status } from "@/assets/js/types";



/**
 * Instantiate the shared application state.
 *
 * The reactive proxy object `shareStatus` represents the shared application state.
 * `updateState` and `setSharedState` are used to modify the state.
 */
const { shareStatus, updateState, setSharedState } = createStore<Status>();

/**
 * Initializes the shared application state with core configurations.
 * This function ensures type safety for the initial state and enforces
 * project-specific rules (e.g., freezing the 'define' object).
 *
 * @param   {Config}        config - The application configuration object.
 * @param   {Define}        define - The application's definition object.
 * @param   {StateOption[]} extra  - Any additional state properties to initialize.
 * @returns {void}
 */
function initializeSharedState(config: Config, define: Define, ...extra: StateOption[]): void {
	setSharedState(
		{ name: "config", value: config, freeze: false },
		{ name: "define", value: define, freeze: true },
		...extra
	);
}



/**
 * Export the instantiated store and initialization logic.
 *
 * These exports are used to reference the latest state via `$status` within components,
 * or to dynamically update the state using `updateState` / `setSharedState` as needed.
 */
export {
	shareStatus,
	updateState,
	setSharedState,
	initializeSharedState
};