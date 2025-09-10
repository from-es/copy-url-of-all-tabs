/*
	@lastupdate 2025/09/10
	@dependency cloneDeep(lodash, https://lodash.com/)
	@reference  隠ぺいされた console.log を無理やり復活させる対症療法(https://clock-up.hateblo.jp/entry/2016/11/05/js-console-log-restore)
					Is it possible to bind a date/time to a console log?(https://stackoverflow.com/questions/18410119/is-it-possible-to-bind-a-date-time-to-a-console-log?answertab=active#tab-top)
					Restoring console.log() - Stack Overflow(https://stackoverflow.com/questions/7089443/restoring-console-log)
*/

import { cloneDeep } from "lodash-es";



// Options for configuring the ConsoleManager
export interface ConsoleManagerOptions {
	logging       : boolean;
	timestamp     : boolean;
	timecoordinate: "UTC" | "GMT";
}

// The methods of the console object that ConsoleManager can override
type ConsoleMethod =
	| "group"
	| "groupCollapsed"
	| "groupEnd"
	| "debug"
	| "info"
	| "log"
	| "warn"
	| "error";



export class ConsoleManager {
	// -------------------------------------------------------------------------------------------------------------------------
	// Private Static Properties

	static #store: { console?: Console } = {};

	static get #originalConsole(): Console {
		if (!ConsoleManager.#store.console) {
			ConsoleManager.#initializeOriginalConsole();
		}
		return cloneDeep(ConsoleManager.#store.console!);
	}

	static #options: ConsoleManagerOptions = {
		logging       : false,
		timestamp     : false,
		timecoordinate: "UTC",
	};

	static readonly #methods: Record<ConsoleMethod, string> = {
		group         : "#996600",
		groupCollapsed: "#996600",
		groupEnd      : "#996600", // No styling applied, but listed for override

		debug: "black",
		info : "green",
		log  : "blue",
		warn : "orange",
		error: "red",
	};

	// Initialize, Class Private Property
	static {
		ConsoleManager.#initializeOriginalConsole();
	}
	// -------------------------------------------------------------------------------------------------------------------------

	// -------------------------------------------------------------------------------------------------------------------------
	// Public Static Methods

	/**
	 * Returns a deep copy of the current options and a reference to the methods.
	 */
	static state(): {
		option: ConsoleManagerOptions;
		method: Record<ConsoleMethod, string>;
		} {
		return {
			option: cloneDeep(ConsoleManager.#options),
			method: ConsoleManager.#methods,
		};
	}

	/**
	 * Sets new options, merging with the existing ones.
	 * @param newOptions - An object with options to update.
	 */
	static option(newOptions: Partial<ConsoleManagerOptions>): void {
		try {
			ConsoleManager.#options = ConsoleManager.#validateAndMergeOptions(newOptions);
		} catch (e) {
			// Log the original error to the original console to avoid loops
			const originalConsole = ConsoleManager.#store.console || console;

			originalConsole.error("Error in ConsoleManager.option():", e);
			throw new Error("ConsoleManager.option() was terminated due to invalid arguments.");
		}
	}

	/**
	 * Applies the configured logging behavior to the global console object.
	 */
	static apply(): void {
		ConsoleManager.#applyCustomConsole();
	}

	/**
	 * Restores the original console object.
	 */
	static restore(): void {
		if (ConsoleManager.#store.console) {
			globalThis.console = ConsoleManager.#originalConsole;
		}
	}
	// -------------------------------------------------------------------------------------------------------------------------

	// -------------------------------------------------------------------------------------------------------------------------
	// Private Static Methods

	/**
	 * Initializes the original console object in the store if it hasn't been already.
	 */
	static #initializeOriginalConsole(): void {
		if (!ConsoleManager.#store.console) {
			Object.defineProperty(ConsoleManager.#store, "console", {
				value: ConsoleManager.#getOriginalConsoleObject(),
				writable: false,
				configurable: true,
			});
		}
	}

	/**
	 * Validates and merges new options with the current options.
	 * @param newOptions - The new options to validate and merge.
	 * @returns The fully validated, merged options object.
	 */
	static #validateAndMergeOptions(
		newOptions: Partial<ConsoleManagerOptions>
	): ConsoleManagerOptions {
		if (!newOptions || typeof newOptions !== "object") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". Argument is not an Object!`);
		}

		const currentOptions                                = ConsoleManager.#options;
		const mergedOptions: Partial<ConsoleManagerOptions> = { ...currentOptions, ...newOptions };

		// Validate each property on the merged object
		if (typeof mergedOptions.logging !== "boolean") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.logging`);
		}
		if (typeof mergedOptions.timestamp !== "boolean") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.timestamp`);
		}
		if (typeof mergedOptions.timecoordinate !== "string" || ![ "UTC", "GMT" ].includes(mergedOptions.timecoordinate.toUpperCase())) {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.timecoordinate`);
		}

		return mergedOptions as ConsoleManagerOptions;
	}

	/**
	 * Applies the custom console methods based on the current options.
	 */
	static #applyCustomConsole(): void {
		const { logging, timestamp, timecoordinate } = ConsoleManager.#options;
		const originalConsole                        = ConsoleManager.#originalConsole;
		const timestampFactory                       = ConsoleManager.#createTimestampFactory(timecoordinate);
		const noop                                   = () => {}; // No-operation function

		for (const key of Object.keys(ConsoleManager.#methods) as ConsoleMethod[]) {
			Object.defineProperty(console, key, {
				get: () => {
					if (!logging) {
						return noop;
					}

					const originalMethod = originalConsole[key] ?? originalConsole.log;

					// groupEnd takes no arguments and should not be styled.
					if (key === "groupEnd") {
						return originalMethod.bind(originalConsole);
					}

					if (timestamp) {
						const time = timestampFactory();
						const color = ConsoleManager.#methods[key];
						return originalMethod.bind(
							originalConsole,
							`%c%s`,
							`color: ${color}`,
							`${time} :::`
						);
					}

					return originalMethod.bind(originalConsole);
				},
				configurable: true,
			});
		}
	}

	/**
	 * Creates a function that returns a timestamp string.
	 * @param timecoordinate - The time coordinate system to use.
	 * @returns A function that generates a timestamp string.
	 */
	static #createTimestampFactory(timecoordinate: "UTC" | "GMT"): () => string {
		const coordinate = timecoordinate.toUpperCase();
		if (coordinate === "GMT") {
			return () => ConsoleManager.#toISOStringWithTimezone(new Date());
		}
		// Default to UTC
		return () => new Date().toISOString();
	}

	/**
	 * Creates an ISO string with timezone information.
	 * @param date - The date object to format.
	 * @returns A formatted date-time string.
	 * @see https://qiita.com/magnoliavine/items/05139982c6fd81212b08
	 */
	static #toISOStringWithTimezone(date: Date): string {
		const pad = (num: number, digits = 2) => num.toString().padStart(digits, "0");

		const year  = date.getFullYear();
		const month = pad(date.getMonth() + 1);
		const day   = pad(date.getDate());
		const hour  = pad(date.getHours());
		const min   = pad(date.getMinutes());
		const sec   = pad(date.getSeconds());
		const ms    = pad(date.getMilliseconds(), 3);

		const tzOffset = -date.getTimezoneOffset();
		const sign     = tzOffset >= 0 ? "+" : "-";
		const tzHour   = pad(Math.floor(Math.abs(tzOffset) / 60));
		const tzMin    = pad(Math.abs(tzOffset) % 60);

		return `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}${sign}${tzHour}:${tzMin}`;
	}

	/**
	 * Creates a clean copy of the original console object's methods.
	 * This iterates over the console object to include all its methods.
	 * @returns A new object containing the original console methods.
	 */
	static #getOriginalConsoleObject(): Console {
		const consoleCopy = {} as { [key: string]: any };
		for (const key in globalThis.console) {
			try {
				const prop = (globalThis.console as any)[key];
				if (typeof prop === "function") {
					consoleCopy[key] = prop;
				}
			} catch (error) {
				// Ignore errors from accessing certain properties on the console object
			}
		}
		return consoleCopy as Console;
	}
}