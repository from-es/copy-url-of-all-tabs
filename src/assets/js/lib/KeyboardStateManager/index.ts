/**
 * Generic abstraction layer for keyboard input management.
 * Wraps hotkeys-js to isolate the dependency and provides a pure class for state management.
 *
 * @file
 * @lastModified 2026-06-05
 */

import hotkeys from "hotkeys-js";



/**
 * Class for managing the status of specific keyboard keys.
 *
 * This class is framework-agnostic, wraps `hotkeys-js` for state tracking,
 * and maintains a Set for currently pressed keys.
 */
export class KeyboardStateManager {
	/**
	 * A set of trigger keys that are currently pressed.
	 * Not reactive by itself; intended to be wrapped by a reactivity system (e.g., Svelte runes).
	 *
	 * @type {Set<string>}
	 */
	public status: Set<string> = new Set();

	/**
	 * An internal list of keys currently being tracked by the manager.
	 *
	 * @type {string[]}
	 */
	private trackedKeys: string[] = [];

	constructor() {
		// Do not register anything here to allow setup() to define the scope
	}

	/**
	 * Sets the scope of tracked keys.
	 *
	 * @param   {string[]} keys - An array of key identifiers to track (e.g., "w", "h", "a").
	 * @returns {void}
	 */
	setup(keys: string[]): void {
		// Unbind any previous handlers
		hotkeys.unbind();

		/*
		  Notes:
		    MUST update trackedKeys BEFORE registration.
		    The registration loop below relies on this updated list to correctly bind hotkeys-js handlers.
		*/
		this.trackedKeys = [ ...new Set(keys) ]
			.map((k) => k.toLowerCase())
			.filter((k) => k !== "none");

		// Register handlers for each key
		this.trackedKeys.forEach((key) => {
			hotkeys(key, () => {});
		});
	}

	/**
	 * Synchronizes the current physical key states from `hotkeys-js` into the `status` set.
	 *
	 * Updates the set by adding or removing keys based on their press state.
	 * This method should be called in response to keyboard events.
	 *
	 * @returns {void}
	 */
	sync(): void {
		// Only sync the keys that were registered in setup()
		this.trackedKeys.forEach((key) => {
			const pressed    = hotkeys.isPressed(key);
			const wasPressed = this.status.has(key);

			if (pressed && !wasPressed) {
				this.status.add(key);

				console.debug("DEBUG(ui): keydown:", key);
			} else if (!pressed && wasPressed) {
				this.status.delete(key);

				console.debug("DEBUG(ui): keyup:", key);
			}
			/*
			  `pressed && wasPressed` はキーリピート状態の為、省略
			*/
		});
	}

	/**
	 * Forces all tracked key states to be cleared from the set.
	 * Useful for clearing state on focus loss or other environment changes.
	 *
	 * @returns {void}
	 */
	reset(): void {
		this.status.clear();
	}

	/**
	 * Stops tracking all keys, unbinds event handlers from `hotkeys-js`, and clears the state.
	 * Should be called when the manager is no longer needed (e.g., component unmount).
	 *
	 * @returns {void}
	 */
	teardown(): void {
		// unbind() with no arguments removes all handlers registered via hotkeys-js.
		hotkeys.unbind();

		this.status.clear();
		this.trackedKeys = [];
	}
}