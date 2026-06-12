/**
 * UI layer for managing keyboard-related window events in the popup menu.
 * Synchronizes browser events with the KeyboardStateManager instance.
 *
 * @file
 */

import { keyboard } from "./triggerKey.svelte.ts";

/**
 * Event handlers designed for use with `<svelte:window>`.
 */
export const uiEvent = {
	/**
	 * Resets key states when the popup gains focus.
	 */
	onFocus: (): void => {
		keyboard.reset();
	},

	/**
	 * Resets key states when the popup loses focus.
	 */
	onBlur: (): void => {
		keyboard.reset();
	},

	/**
	 * Synchronizes key states when a key is pressed.
	 */
	onKeyDown: (): void => {
		keyboard.sync();
	},

	/**
	 * Synchronizes key states when a key is released.
	 */
	onKeyUp: (): void => {
		keyboard.sync();
	}
};