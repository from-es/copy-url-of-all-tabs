/**
 * Controller class for managing the extension's badge display.
 *
 * @file
 * @lastModified 2026-06-09
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import Types
import type { Config }           from "@/assets/js/types";
import type { SetTimeoutHandle } from "@/assets/js/types";



type BadgeColor = {
	text      : string;
	background: string;
};
type BadgeThemeTemplate = {
	default: BadgeColor;
	light  : BadgeColor;
	dark   : BadgeColor;
};

type NullableTimeoutHandle = SetTimeoutHandle | null;



/**
 * Class that controls the badge display of the extension.
 *
 * Manages updates to badge text and colors synchronously, relying on
 * browser IPC ordering to prevent race conditions without a JS queue.
 */
class BadgeController {
	/**
	 * Whether the badge display is currently enabled.
	 */
	#isEnabled: boolean = false;
	/**
	 * The current badge color settings applied to the browser API.
	 */
	#color: BadgeColor = {
		text      : "",
		background: ""
	};
	/**
	 * Template for predefined badge themes (color settings).
	 * Includes color information for light, dark, and default themes.
	 */
	#template: BadgeThemeTemplate = {
		default: {
			text      : "#ffffff",
			background: "#767676"
		},
		light: {
			text      : "#000000",
			background: "#ffffff"
		},
		dark: {
			text      : "#ffffff",
			background: "#000000"
		}
	};

	/**
	 * Waiting time (in milliseconds) before clearing the badge when the count becomes 0.
	 */
	#waitingTime: number = 3000;  // millisecond

	/**
	 * The latest text that should be displayed on the badge.
	 */
	#pendingText: string | null = null;

	/**
	 * Timer ID for the delayed clear operation.
	 */
	#clearTimer: NullableTimeoutHandle = null;

	/**
	 * Timer ID for debouncing rapid synchronous updates.
	 */
	#debounceTimer: NullableTimeoutHandle = null;

	/**
	 * Constructor for BadgeController.
	 */
	constructor() {
		this.#color = structuredClone(this.#template.default);
		this.initializeColor();
	}

	/**
	 * Load settings from storage and initialize badge colors.
	 *
	 * @returns {Promise<void>} Resolves when initialization is complete.
	 */
	private async initializeColor(): Promise<void> {
		try {
			const { config } = await browser.storage.local.get("config") as { config: Config };

			if (config && Object.hasOwn(config, "Badge")) {
				this.updateColor(config.Badge);
			}
		} catch (error) {
			console.error("ERROR(badge): Exception: failed to initialize badge color from storage", { error });
			await this.applyColor(this.#color);
		}
	}

	/**
	 * Update badge colors.
	 *
	 * @param {Config["Badge"]} badgeConfig - Badge configuration object.
	 */
	public updateColor(badgeConfig: Config["Badge"]): void {
		if (!badgeConfig || typeof badgeConfig !== "object") {
			console.error("ERROR(badge): Invalid: invalid badge config provided to updateColor", badgeConfig);
			return;
		}

		this.#isEnabled = badgeConfig.enable;

		if (!this.#isEnabled) {
			this.clearClearTimer();
			// Fire and forget: rely on browser IPC ordering to update UI without blocking the event loop.
			browser.action.setBadgeText({ text: "" }).catch(error => console.error("ERROR(badge): Exception: failed to clear badge text", { error }));
			return;
		}

		let newColor: BadgeColor;

		switch (badgeConfig.theme.type) {
			case "light":
				newColor = structuredClone(this.#template.light);
				break;
			case "dark":
				newColor = structuredClone(this.#template.dark);
				break;
			case "custom":
				newColor = badgeConfig.theme.color;
				break;
			default:
				console.error("ERROR(badge): Error: unknown badge theme type", badgeConfig.theme.type);
				return;
		}

		if (!newColor || typeof newColor.text !== "string" || typeof newColor.background !== "string") {
			console.error("ERROR(badge): Invalid: invalid color object derived from config", newColor);
			return;
		}

		this.#color = newColor;
		this.applyColor(this.#color);

		// If the badge is enabled and there is a pending text, re-apply it.
		if (this.#pendingText !== null) {
			this.updateText(this.#pendingText);
		}
	}

	/**
	 * Apply colors by calling the browser API.
	 *
	 * @param   {BadgeColor}    color - The color settings to apply.
	 * @returns {Promise<void>}         Resolves when the colors have been applied.
	 */
	private async applyColor(color: BadgeColor): Promise<void> {
		try {
			await browser.action.setBadgeTextColor({ color: color.text });
			await browser.action.setBadgeBackgroundColor({ color: color.background });
		} catch (error) {
			console.error("ERROR(badge): Exception: failed to apply badge color", { error, color });
		}
	}

	/**
	 * Clear the delayed badge clear timer if it exists.
	 */
	private clearClearTimer(): void {
		if (this.#clearTimer) {
			clearTimeout(this.#clearTimer);
			this.#clearTimer = null;
		}
	}

	/**
	 * Update badge text.
	 *
	 * If the count is 0, "0" is displayed temporarily before the badge is cleared.
	 * Coalesces rapid synchronous updates.
	 *
	 * @param {string} text - The display text (numeric string).
	 */
	public updateText(text: string): void {
		this.#pendingText = text;
		this.clearClearTimer();

		if (!this.#isEnabled) {
			return;
		}

		if (this.#debounceTimer === null) {
			this.#debounceTimer = setTimeout(() => {
				this.#debounceTimer = null;
				this.flushTextUpdate();
			}, 0);
		}
	}

	/**
	 * Dispatch the badge text update to the browser API.
	 *
	 * Called by the debounce timer to apply the latest `#pendingText`,
	 * ensuring that rapid consecutive calls to `updateText` result in
	 * only a single API invocation.
	 */
	private flushTextUpdate(): void {
		const text = this.#pendingText;
		if (text === null || !this.#isEnabled) {
			return;
		}

		const count = parseInt(text, 10);

		if (typeof count !== "number" || isNaN(count) || count < 0) {
			// Fire and forget: rely on browser IPC ordering to update UI without blocking the event loop.
			browser.action.setBadgeText({ text: "" }).catch(error => console.error("ERROR(badge): Exception: failed to clear badge text", { error }));
			return;
		}

		if (count > 0) {
			// Fire and forget: rely on browser IPC ordering to update UI without blocking the event loop.
			browser.action.setBadgeText({ text: String(count) }).catch(error => console.error("ERROR(badge): Exception: failed to set badge text", { error }));
			return;
		}

		// Display "0" and set a timer to clear it after #waitingTime
		// Fire and forget: rely on browser IPC ordering to update UI without blocking the event loop.
		browser.action.setBadgeText({ text: "0" }).catch(error => console.error("ERROR(badge): Exception: failed to set temporary badge text '0'", { error }));

		this.#clearTimer = setTimeout(() => {
			if (this.#pendingText === "0" && this.#isEnabled) { // Check #isEnabled again in case it changed during the timeout
				// Fire and forget: rely on browser IPC ordering to update UI without blocking the event loop.
				browser.action.setBadgeText({ text: "" }).catch(error => console.error("ERROR(badge): Exception: failed to clear badge text after delay", { error }));
			}
			this.#clearTimer = null;
		}, this.#waitingTime);
	}
}



// Export as a singleton instance.
const badgeController = new BadgeController();

export {
	badgeController,
	BadgeController
};