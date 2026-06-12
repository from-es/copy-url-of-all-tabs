/**
 * Domain layer for managing TriggerKeys in the popup menu.
 * Bridges the KeyboardStateManager class with Svelte's reactivity system.
 *
 * @file
 * @lastModified 2026-05-27
 */

// WXT provided cross-browser compatible API and Types.
import { browser } from "wxt/browser";

// Import Svelte
import { onDestroy } from "svelte";

// Import Svelte Object
import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

// Import Module
import { cloneObject }          from "@/assets/js/lib/CloneObject";
import { KeyboardStateManager } from "@/assets/js/lib/KeyboardStateManager";



type TriggerContext = {
	queryInfo     : Browser.tabs.QueryInfo;
	buttonLabel   : {
		Copy : string | null;
		Paste: string | null;
	},
	pasteOverrides: {
		reverse: boolean;
		active : boolean;
	};
};


/**
 * Retrieves the current reactive trigger context.
 *
 * @returns {TriggerContext} The current trigger context containing query info and overrides.
 */
function getTriggerContext(): TriggerContext {
	return createTriggerContext();
}

/**
 * Calculates and creates the trigger context based on the current physical keyboard state.
 * Evaluates which modifier keys are pressed to determine the scope of tab selection
 * and whether to temporarily override user preferences for opening tabs.
 *
 * @returns {TriggerContext} An object representing the context for popup actions.
 */
function createTriggerContext(): TriggerContext {
	const config                                          = status.config.KeyBindings?.PopupMenu;
	const qInfo: Parameters<typeof browser.tabs.query>[0] = cloneObject(status.define.TabOpenQueryInfo);
	const label: { Copy: string[], Paste: string[] }      = { Copy: [], Paste: [] };

	const pasteOverrides = {
		reverse: status.config.Tab.reverse,
		active : status.config.Tab.active
	};

	if (!config) {
		return { queryInfo: qInfo, buttonLabel: { Copy: null, Paste: null }, pasteOverrides };
	}

	// Copy Logic
	if (keyboard.status.has(config.copy.allWindows)) {
		// allWindows copy: remove currentWindow restriction to query all windows.
		delete qInfo.currentWindow;
		label.Copy.push("All Windows");
	}
	if (keyboard.status.has(config.copy.highlighted)) {
		// highlighted copy: add highlighted: true to query.
		qInfo.highlighted = true;
		label.Copy.push("Highlighted");
	}

	// Paste Logic (Overrides)
	if (keyboard.status.has(config.paste.active)) {
		// Temporary override of the active setting.
		pasteOverrides.active = !status.config.Tab.active;
		label.Paste.push("Active");
	}
	if (keyboard.status.has(config.paste.reverse)) {
		// Temporary override of the reverse setting.
		pasteOverrides.reverse = !status.config.Tab.reverse;
		label.Paste.push("Reverse");
	}

	return { queryInfo: qInfo, buttonLabel: buildButtonLabelText(label), pasteOverrides };
}

/**
 * 物理キーの入力状態に基づいて、ボタンに表示する補助ラベル文字列を構築します。
 * 複数の修飾キーが押されている場合はカンマ区切りで結合し、各単語は指定の長さを超える場合に切り詰めます。
 *
 * @param   {Object} label - コピーおよびペーストアクションごとのラベル配列。
 * @returns {Object}         フォーマットされたラベル文字列（ラベルがない場合は null）。
 */
function buildButtonLabelText(label: { Copy: string[], Paste: string[] }): { Copy: string | null, Paste: string | null } {
	const wordLength = 10;

	const format = (tags: string[]): string | null => {
		if (tags.length === 0) {
			return null;
		}
		if (tags.length === 1) {
			return tags[0];
		}

		return tags
			.map(str => str.length > wordLength ? str.slice(0, wordLength) : str)
			.join(",");
	};

	return {
		Copy : format(label.Copy),
		Paste: format(label.Paste)
	};
}

/**
 * Initializes the keyboard manager with keys defined in the user's configuration.
 * Sets up an onDestroy hook to ensure proper cleanup.
 *
 * @returns {void}
 */
function initTriggerKeys(): void {
	const bindings = status.config.KeyBindings?.PopupMenu;

	if (!bindings) {
		console.warn("WARN(keyboard): KeyBindings for PopupMenu are not defined in config.");
		return;
	}

	const keys = [
		bindings.copy.allWindows,
		bindings.copy.highlighted,
		bindings.paste.reverse,
		bindings.paste.active
	];

	keyboard.setup(keys);

	onDestroy(() => {
		keyboard.teardown();
	});
}

/**
 * Wrapper class that encapsulates the KeyboardStateManager and exposes
 * its status as a Svelte reactive $state.
 */
class ReactiveKeyboardStateManager {
	/** The underlying non-reactive keyboard state logic. */
	private manager = new KeyboardStateManager();

	/**
	 * Reactive set containing the keys currently considered "pressed" or active.
	 * Monitored by Svelte's reactivity system to trigger derived state updates.
	 */
	status = $state<Set<string>>(new Set());

	/**
	 * Initializes the keyboard manager with a specific list of keys to monitor.
	 *
	 * @param {string[]} keys - The list of keyboard keys to be tracked.
	 */
	setup(keys: string[]): void {
		this.manager.setup(keys);
		this.status = new Set(this.manager.status);
	}

	/**
	 * Synchronizes the internal status with the current physical state of the keyboard.
	 * Updates the reactive `status` property to notify subscribers.
	 */
	sync(): void {
		this.manager.sync();
		// Force reactivity by creating a new Set instance.
		this.status = new Set(this.manager.status);
	}

	/**
	 * Resets all tracked keys to an inactive state.
	 */
	reset(): void {
		this.manager.reset();
		this.status = new Set(this.manager.status);
	}

	/**
	 * Removes event listeners and performs cleanup.
	 */
	teardown(): void {
		this.manager.teardown();
		this.status = new Set(this.manager.status);
	}
}

/**
 * Singleton instance of the reactive keyboard state manager.
 */
const keyboard = new ReactiveKeyboardStateManager();





export {
	initTriggerKeys,
	getTriggerContext,
	keyboard
};