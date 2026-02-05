/*
	@lastupdate 2026/02/03
	@dependency cloneDeep (lodash, https://lodash.com/)
	@reference  隠ぺいされた console.log を無理やり復活させる対症療法 (https://clock-up.hateblo.jp/entry/2016/11/05/js-console-log-restore)
	            Is it possible to bind a date/time to a console log? (https://stackoverflow.com/questions/18410119/is-it-possible-to-bind-a-date-time-to-a-console-log?answertab=active#tab-top)
	            Restoring console.log() - Stack Overflow (https://stackoverflow.com/questions/7089443/restoring-console-log)

*/

// Import NPM Package
import { cloneDeep } from "lodash-es";

// Import Types
import {
	ConsoleManagerOptions,
	LogLevel,
	LOG_LEVELS,
	METHOD_TO_LEVEL,
	ConsoleMethod,
	GroupConsoleMethod,
	TimeCoordinate,
} from "./types";

export class ConsoleManager {
	// -------------------------------------------------------------------------------------------------------------------------
	// Private Static Properties

	static #store: { console?: Console } = {};

	/**
	 * Returns a deep copy of the original `console` object.
	 * If the original console is not yet stored, it will be initialized first.
	 *
	 * @returns {Console} A deep copy of the original console object.
	 */
	static get #originalConsole(): Console {
		if (!ConsoleManager.#store.console) {
			ConsoleManager.#initializeOriginalConsole();
		}

		return cloneDeep(ConsoleManager.#store.console!);
	}

	static #options: ConsoleManagerOptions = {
		logging       : true,
		loglevel      : "warn",
		methodLabel   : true,
		timestamp     : true,
		timecoordinate: "UTC"
	};

	static readonly #methods: Record<ConsoleMethod | GroupConsoleMethod, string> = {
		group         : "#996600",
		groupCollapsed: "#996600",
		groupEnd      : "#996600", // No styling applied, but listed for completeness

		trace: "darkblue",
		debug: "blue",
		info : "green",
		log  : "black",
		warn : "orange",
		error: "red",
	};

	/**
	 * Determines if a given method name is a console method that supports custom styling.
	 * This method acts as a type guard, narrowing the type of `method`.
	 *
	 * @param   {string} method - The method name to check.
	 * @returns {method is ConsoleMethod | GroupConsoleMethod} `true` if the method is a target for styling, `false` otherwise.
	 */
	static #isStylingTarget(method: string): method is ConsoleMethod | GroupConsoleMethod {
		return method in ConsoleManager.#methods;
	}

	// Initialize, Class Private Property
	static {
		ConsoleManager.#initializeOriginalConsole();
	}
	// -------------------------------------------------------------------------------------------------------------------------

	// -------------------------------------------------------------------------------------------------------------------------
	// Public Static Methods

	/**
	 * Returns a deep copy of the current options and a reference to the method styling definitions.
	 *
	 * @returns {{
	 *   option: ConsoleManagerOptions;
	 *   method: Record<ConsoleMethod | GroupConsoleMethod, string>;
	 * }} An object containing the current state, with a clone of the options and a reference to the method styles.
	 */
	static state(): {	option: ConsoleManagerOptions; method: Record<ConsoleMethod | GroupConsoleMethod, string>; } {
		return {
			option: cloneDeep(ConsoleManager.#options),
			method: ConsoleManager.#methods,
		};
	}

	/**
	 * Sets new options, merging them with the existing ones.
	 *
	 * @param  {Partial<ConsoleManagerOptions>} newOptions - An object with options to update.
	 * @throws {TypeError}                                 - If `newOptions` is not a valid object or contains properties of the wrong type.
	 */
	static option(newOptions: Partial<ConsoleManagerOptions>): void {
		try {
			ConsoleManager.#options = ConsoleManager.#validateAndMergeOptions(newOptions);
		} catch (error) {
			// Log the original error to the original console to avoid loops
			const originalConsole = ConsoleManager.#store.console || console;

			originalConsole.error("Error in ConsoleManager.option():", error);
			throw new Error("ConsoleManager.option() was terminated due to invalid arguments.");
		}
	}

	/**
	 * Applies the configured logging behavior to the global `console` object.
	 * This method should be called once at application startup.
	 */
	static apply(): void {
		ConsoleManager.#applyCustomConsole();
	}

	/**
	 * Restores the global `console` object to its original state.
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
	 * Initializes and stores a copy of the original `console` object if it hasn't been already.
	 * This ensures that the original console functionality can be restored later.
	 */
	static #initializeOriginalConsole(): void {
		if (!ConsoleManager.#store.console) {
			Object.defineProperty(
				ConsoleManager.#store,
				"console",
				{
					value       : ConsoleManager.#getOriginalConsoleObject(),
					writable    : false,
					configurable: true,
				}
			);
		}
	}

	/**
	 * Validates and merges new options with the current options.
	 *
	 * @param   {Partial<ConsoleManagerOptions>} newOptions - The new options to validate and merge.
	 * @returns {ConsoleManagerOptions}                     - The fully validated, merged options object.
	 * @throws  {TypeError}                                 - If any of the provided options are of an invalid type.
	 */
	static #validateAndMergeOptions(newOptions: Partial<ConsoleManagerOptions>): ConsoleManagerOptions {
		if (!newOptions || typeof newOptions !== "object") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". Argument is not an Object!`);
		}

		const currentOptions                                = ConsoleManager.#options;
		const mergedOptions: Partial<ConsoleManagerOptions> = { ...currentOptions, ...newOptions };

		// Validate each property on the merged object
		if (typeof mergedOptions.logging !== "boolean") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.logging`);
		}
		if (typeof mergedOptions.loglevel !== "string" || !Object.keys(LOG_LEVELS).includes(mergedOptions.loglevel)) {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.loglevel`);
		}
		if (typeof mergedOptions.methodLabel !== "boolean") {
			throw new TypeError(`Invalid arguments passed for parameter to "ConsoleManager.option()". argument >> obj.methodLabel`);
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
	 * Overrides the global `console` methods based on the current options.
	 * This is the core method that applies log level filtering, timestamps, and styling.
	 */
	static #applyCustomConsole(): void {
		const { logging, loglevel } = ConsoleManager.#options;
		const originalConsole       = ConsoleManager.#originalConsole;
		const noop                  = () => {}; // No-operation function

		// If logging is disabled or loglevel is silent, override all console methods with a no-op function.
		if (!logging || loglevel === "silent") {
			for (const key in originalConsole) {
				if (typeof (originalConsole as any)[key] === "function") {
					Object.defineProperty(
						globalThis.console,
						key,
						{
							get         : () => noop,
							configurable: true
						}
					);
				}
			}

			return;
		}

		const currentLogLevelValue = LOG_LEVELS[loglevel];

		// Override console methods based on log level and options.
		for (const key in originalConsole) {
			if (typeof (originalConsole as any)[key] !== "function") {
				continue;
			}

			const methodName = key as keyof Console;
			const descriptor: PropertyDescriptor = {
				get: () => {
					const originalMethod              = (originalConsole as any)[methodName];
					const isLogLevelTarget            = (methodName in METHOD_TO_LEVEL);
					const isStylingAndTimestampTarget = ConsoleManager.#isStylingTarget(methodName);

					if (isLogLevelTarget) {
						const methodLevel = METHOD_TO_LEVEL[methodName as ConsoleMethod];

						if (LOG_LEVELS[methodLevel] < currentLogLevelValue) {
							return noop;
						}
					}

					// Return a wrapper function to handle timestamp and styling if applicable
					return ConsoleManager.#createConsoleMethodWrapper(
						methodName,
						originalMethod,
						originalConsole,
						isStylingAndTimestampTarget
					);
				},
				configurable: true,
			};

			Object.defineProperty(globalThis.console, methodName, descriptor);
		}
	}

	/**
	 * Creates a wrapper for a console method to add features like timestamps and styling.
	 *
	 * Depending on the current configuration, this wrapper prepends a timestamp to the
	 * console output. If styling is applicable for the given method, it also adds
	 * color-coding (e.g., for `warn` or `error`).
	 *
	 * The `groupEnd` method is returned unmodified as it takes no arguments.
	 * If timestamps are disabled, the original method is also returned directly.
	 *
	 * @param {keyof Console}             methodName                  - The name of the console method to wrap (e.g., "log", "warn").
	 * @param {(...args: any[]) => any}   originalMethod              - The original console method function.
	 * @param {Console}                   originalConsole             - The original console object, used as the `this` context for the method.
	 * @param {boolean}                   isStylingAndTimestampTarget - A flag indicating if the method is a target for styling.
	 * @returns {(...args: any[]) => any}                             - A new function that wraps the original console method.
	 */
	static #createConsoleMethodWrapper(
		methodName: keyof Console,
		originalMethod: (...args: any[]) => any,
		originalConsole: Console,
		isStylingAndTimestampTarget: boolean,
	): (...args: any[]) => any {
		const { timestamp, methodLabel } = ConsoleManager.#options;

		// `groupEnd` takes no arguments and should not be styled.
		if (methodName === "groupEnd") {
			return originalMethod.bind(originalConsole);
		}

		// If both timestamp and methodLabel are disabled, return the original method
		if (!timestamp && !methodLabel) {
			return originalMethod.bind(originalConsole);
		}

		const { formatString, styleArgs } = ConsoleManager.#formatConsoleArguments(methodName, isStylingAndTimestampTarget);
		const consoleArgs                 = [ ...styleArgs ];
		const delimiter                   = ":::";

		if (formatString) {
			consoleArgs.unshift(`${formatString.trim()} ${delimiter}`);
		}

		return originalMethod.bind(originalConsole, ...consoleArgs);
	}

	/**
	 * Formats console arguments by prepending a timestamp and/or method label, and applies styling if applicable.
	 *
	 * This method constructs the initial arguments for a console method based on the current
	 * configuration options for timestamp, method label, and styling.
	 *
	 * @param   {keyof Console}                               methodName                  - The name of the console method being wrapped (e.g., "log", "warn").
	 * @param   {boolean}                                     isStylingAndTimestampTarget - A flag indicating if the method is a target for styling.
	 * @returns {{formatString: string, styleArgs: string[]}}                             - An object containing the formatted string and an array of style arguments.
	 */
	static #formatConsoleArguments(
		methodName: keyof Console,
		isStylingAndTimestampTarget: boolean
	): { formatString: string; styleArgs: string[] } {
		const { timestamp, timecoordinate, methodLabel } = ConsoleManager.#options;
		const currentMethod                              = methodName as ConsoleMethod | GroupConsoleMethod;
		const styleArgs: string[]                        = [];
		let   formatString                               = "";
		let   prefix                                     = "";

		// Build the prefix string based on timestamp and methodLabel options.
		if (timestamp) {
			const time = ConsoleManager.#createTimestampFactory(timecoordinate)();

			prefix += `[${time}]`;
		}
		if (methodLabel) {
			prefix += ` [${currentMethod.toUpperCase()}]`;
		}
		prefix = prefix.trim();

		// Apply styling if the method is a target and there's a prefix to style.
		if (isStylingAndTimestampTarget && prefix) {
			const color = ConsoleManager.#methods[currentMethod];

			formatString = `%c${prefix}`;
			styleArgs.push(`color: ${color}`);
		} else {
			formatString = prefix;
		}

		return { formatString, styleArgs };
	}

	/**
	 * Creates a factory function that returns a timestamp string based on the specified time coordinate.
	 *
	 * @param   {TimeCoordinate} timecoordinate - The time coordinate system to use ('UTC' or 'GMT').
	 * @returns {() => string}                  - A function that generates a timestamp string.
	 */
	static #createTimestampFactory(timecoordinate: TimeCoordinate): () => string {
		const coordinate = timecoordinate.toUpperCase();

		if (coordinate === "GMT") {
			return () => ConsoleManager.#toISOStringWithTimezone(new Date());
		}

		// Default to UTC
		return () => new Date().toISOString();
	}

	/**
	 * Creates an ISO string with timezone information (e.g., "2023-10-27T10:00:00.000+09:00").
	 *
	 * @param   {Date}   date - The date object to format.
	 * @returns {string}      - A formatted date-time string.
	 * @see https://qiita.com/magnoliavine/items/05139982c6fd81212b08
	 */
	static #toISOStringWithTimezone(date: Date): string {
		const pad      = (num: number, digits = 2) => num.toString().padStart(digits, "0");
		const year     = date.getFullYear();
		const month    = pad(date.getMonth() + 1);
		const day      = pad(date.getDate());
		const hour     = pad(date.getHours());
		const min      = pad(date.getMinutes());
		const sec      = pad(date.getSeconds());
		const ms       = pad(date.getMilliseconds(), 3);

		const tzOffset = date.getTimezoneOffset() * -1;
		const sign     = tzOffset >= 0 ? "+" : "-";
		const tzHour   = pad(Math.floor(Math.abs(tzOffset) / 60));
		const tzMin    = pad(Math.abs(tzOffset) % 60);

		return `${year}-${month}-${day}T${hour}:${min}:${sec}.${ms}${sign}${tzHour}:${tzMin}`;
	}

	/**
	 * Creates a clean copy of the original `console` object, including all its methods.
	 *
	 * @returns {Console} A new object containing the original console methods.
	 */
	static #getOriginalConsoleObject(): Console {
		const copiedConsole = {} as { [key: string]: any };

		for (const key in globalThis.console) {
			try {
				const prop = (globalThis.console as any)[key];

				if (typeof prop === "function") {
					copiedConsole[key] = prop;
				}
			} catch (error) {
				// Ignore errors from accessing certain properties on the console object
			}
		}

		return copiedConsole as Console;
	}
}