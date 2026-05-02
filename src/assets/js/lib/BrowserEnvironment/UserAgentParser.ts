/**
 * Parser that retrieves information from User-Agent strings or User-Agent Client Hints.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import Types
import type { UserAgentParserPluginParseData } from "./types";



/**
 * This is an external library wrapper class that retrieves information from 'User-Agent' or 'User-Agent Client Hints'.
 * This class encapsulates dependencies on the library, thereby facilitating migration to other libraries.
 */
export class UserAgentParser {
	/**
	 * A function injected via Dependency Injection (DI) that executes the parsing process of a specific User-Agent parsing library.
	 */
	#pluginExecute: () => UserAgentParserPluginParseData | null;

	/**
	 * The name of the User-Agent parsing library currently in use.
	 */
	#useLibrary: string;

	/**
	 *
	 * @param {function(): UserAgentParserPluginParseData | null} pluginExecute - The function to execute the parsing process of the User-Agent parsing library. This is injected via DI.
	 * @param {string}                                            useLibrary    - The name of the library being used.
	 */
	constructor(pluginExecute: () => UserAgentParserPluginParseData | null, useLibrary: string) {
		this.#pluginExecute = pluginExecute;
		this.#useLibrary    = useLibrary;
	}

	/**
	 * Parses the user-agent string using an injected plugin function and returns a structured result.
	 * If parsing is not possible (e.g., user-agent is unavailable or the plugin fails), it returns a default object.
	 *
	 * @returns {UserAgentParserPluginParseData | null} A structured object with browser, engine, and OS information, or a default object on failure.
	 */
	parse(): UserAgentParserPluginParseData | null {
		const userAgent    = ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined;
		const failedResult = {
			browser: { name: undefined, version: undefined },
			engine : { name: undefined, version: undefined },
			os     : { name: undefined, version: undefined, versionName: undefined }
		};

		if ( !userAgent ) {
			// Return a default structure if userAgent is not available
			return failedResult;
		}

		// start: From this point onward, the code depends on external libraries
		const result = this.#pluginExecute();

		if ( !result ) {
			return failedResult;
		}
		// end: ----------------------------------------------------------------

		return result;
	}

	/**
	 * Returns the name of the User-Agent parsing library in use.
	 */
	get useLibrary(): string {
		return this.#useLibrary;
	}
}