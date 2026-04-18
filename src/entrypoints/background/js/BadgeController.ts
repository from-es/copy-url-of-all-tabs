/**
 * Controller class for managing the extension's badge display.
 *
 * @file
 * @lastModified 2026-04-18
 */

// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";

// Import NPM Package
import PQueue from "p-queue";

// Import Module
import { sleep } from "@/assets/js/utils/sleep";

// Import Types
import type { Config } from "@/assets/js/types";



type BadgeColor = {
	text      : string;
	background: string;
};
type BadgeThemeTemplate = {
	default: BadgeColor;
	light  : BadgeColor;
	dark   : BadgeColor;
};



/**
 * Class that controls the badge display of the extension.
 *
 * Manages updates to badge text and colors, using a queue to avoid conflicts between asynchronous operations.
 */
class BadgeController {
	#isEnabled: boolean = false;  // Keeps track of whether the badge is enabled.
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
	 * Queue for serializing badge UI operations (text, color updates).
	 * Avoids race conditions between asynchronous API calls.
	 */
	readonly #queue: PQueue;

	/**
	 * Constructor for BadgeController.
	 *
	 * Sets default badge colors and initializes the UI operation queue.
	 * Initialization is performed via the queue.
	 */
	constructor() {
		// Initialize the badge theme.
		this.#color = structuredClone(this.#template.default);

		// Queue for serializing UI operations.
		this.#queue = new PQueue({ concurrency: 1 });

		// PQueue error handling.
		this.#queue.on("error", (error) => {
			console.error("ERROR(badge): pqueue error in BadgeController", error);
		});

		// Perform initialization via the queue.
		this.#queue.add(() => this.initializeColor());
	}

	/**
	 * Load settings from storage and initialize badge colors.
	 *
	 * @returns {Promise<void>} Promise that resolves when the color has been initialized.
	 */
	private async initializeColor(): Promise<void> {
		try {
			const { config } = await browser.storage.local.get("config") as { config: Config };

			if (config && Object.hasOwn(config, "Badge")) {
				this.updateColor(config.Badge);
			}
		} catch (error) {
			console.error("ERROR(badge): Exception: failed to initialize badge color from storage", { error });

			// Continue with the default color even if retrieval from storage fails.
			await this.applyColor(this.#color);
		}
	}

	/**
	 * Update badge colors.
	 *
	 * @param {Config["Badge"]} badgeConfig - Badge configuration object.
	 */
	public updateColor(badgeConfig: Config["Badge"]): void {
		this.#queue.add(async () => {
			if (!badgeConfig || typeof badgeConfig !== "object") {
				console.error("ERROR(badge): Invalid: invalid badge config provided to updateColor", badgeConfig);
				return;
			}

			this.#isEnabled = badgeConfig.enable;  // Update the "enabled/disabled" state of the badge counter display.

			if (!this.#isEnabled) {
				// If disabled, clear the badge and exit.
				await browser.action.setBadgeText({ text: "" });
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

			// Do nothing if the color settings are invalid.
			if (!newColor || typeof newColor.text !== "string" || typeof newColor.background !== "string") {
				console.error("ERROR(badge): Invalid: invalid color object derived from config", newColor);
				return;
			}

			this.#color = newColor;
			await this.applyColor(this.#color);
		});
	}

	/**
	 * Apply colors by calling the browser API.
	 *
	 * @param   {BadgeColor}    color - The color settings to apply.
	 * @returns {Promise<void>}         Promise that resolves when the color has been applied.
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
	 * Update badge text.
	 *
	 * If the count is 0, "0" is displayed temporarily before the badge is cleared.
	 *
	 * @param {string} text - The display text (numeric string).
	 */
	public updateText(text: string): void {
		if (!this.#isEnabled) {
			// Do nothing if it's already disabled.
			return;
		}

		const count = parseInt(text, 10);

		// Clear the badge if the value is invalid.
		if (typeof count !== "number" || isNaN(count) || count < 0) {
			this.#queue.add(() => browser.action.setBadgeText({ text: "" }));
			return;
		}

		// If the count is greater than 0, display the number.
		if (count > 0) {
			this.#queue.add(async () => {
				try {
					await browser.action.setBadgeText({ text: String(count) });
				} catch (error) {
					console.error("ERROR(badge): failed to set badge text", { error, text: String(count) });
				}
			});
			return;
		}

		// If the count is 0, display "0" for a specified time (#waitingTime) and then clear it.
		this.#queue.add(async () => {
			try {
				await browser.action.setBadgeText({ text: "0" });

				try {
					// sleep itself performs validation and throws an exception if the value is invalid.
					await sleep(this.#waitingTime);
				// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
				} catch (sleepError) {
					// Skip waiting and proceed to clear if sleep fails.
				}
			} catch (error) {
				console.error("ERROR(badge): Exception: failed to display temporary '0' on badge", { error });
			} finally {
				try {
					await browser.action.setBadgeText({ text: "" });
				} catch (error) {
					console.error("ERROR(badge): Exception: failed to clear badge text in finally", { error });
				}
			}
		});
	}
}



// Export as a singleton instance.
export const badgeController = new BadgeController();