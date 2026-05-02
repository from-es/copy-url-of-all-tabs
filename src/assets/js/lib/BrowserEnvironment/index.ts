/**
 * Utility for obtaining browser environment information.
 * Prioritizes the User-Agent Client Hints API in modern browsers and falls back to the traditional User-Agent string as needed.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import Module
import { UserAgentParser }       from "./UserAgentParser";
import { UserAgentParserPlugin } from "./plugins/bowser";

// Import Types
import type {
	NavigatorUserAgentData,
	BrowserEnvironmentResult,
	CheckerInfo,
	UserAgentClientHintsInfo,
	UserAgentDataBrand,
	UserAgentParserPluginParseData
} from "./types";



// Extend the Navigator interface to include userAgentData
declare global {
	/**
	 * Extends the global Navigator interface to include the `userAgentData` property,
	 * which is part of the User-Agent Client Hints API.
	 */
	interface Navigator {
		userAgentData?: NavigatorUserAgentData;
	}
}



/**
 * A class to retrieve and parse browser environment information from either the User-Agent Client Hints API or the traditional User-Agent string.
 * It encapsulates the logic for fetching, parsing, and consolidating browser data.
 */
export class BrowserEnvironment {
	/**
	 * A default, empty result object used as a template for all environment information results.
	 */
	static readonly #defaultBrowserEnvironmentResult = BrowserEnvironment.#createDefaultBrowserEnvironmentResult();

	/**
	 * An instance of the UserAgentParser, configured with a plugin for parsing the User-Agent string.
	 * This demonstrates Dependency Injection (DI) by providing the parsing logic externally.
	 */
	static readonly #parser = new UserAgentParser(UserAgentParserPlugin.execute, UserAgentParserPlugin.information.useLibrary);  // Dependency Injection (DI) performed here

	/**
	 * An array of strings representing the high-entropy values to request from the User-Agent Client Hints API.
	 *
	 * "uaFullVersion" is deprecated
	 */
	static readonly #highEntropyValueHints = [ "brands", "platform", "platformVersion", "mobile", "architecture", "bitness", "model", "uaFullVersion", "fullVersionList", "formFactor", "wow64" ];

	/**
	 * Asynchronously retrieves browser environment information.
	 * This is the main public method of the class.
	 *
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information.
	 */
	async get(): Promise<BrowserEnvironmentResult> {
		const result = await this.#getBrowserEnvironment();

		return result;
	}

	/**
	 * Determines the appropriate method for fetching browser data (Client Hints or User-Agent string) and returns the result.
	 * It handles cases where neither method is available and catches any unexpected errors.
	 *
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information.
	 */
	async #getBrowserEnvironment(): Promise<BrowserEnvironmentResult> {
		try {
			if ( "userAgentData" in globalThis.navigator ) {
				const result = await this.#getUserAgentClientHints();

				return this.#supplementClientHintsWithUserAgent(result);
			} else if ( "userAgent" in globalThis.navigator ) {
				return this.#getUserAgent();
			} else {
				return this.#createErrorResult("This Browser cannot get Browser Environment Information. 'navigator.userAgent' & 'navigator.userAgentData' are not supported.");
			}
		} catch (error) {
			console.error("ERROR(core): unexpected error in getBrowserEnvironment", { error });

			return this.#createErrorResult("An unexpected error occurred while retrieving browser environment information.");
		}
	}

	/**
	 * Creates a standardized error result object when browser information cannot be retrieved.
	 *
	 * @param   {string}                   message - The error message to include in the result.
	 * @returns {BrowserEnvironmentResult}           The error result object.
	 */
	#createErrorResult(message: string): BrowserEnvironmentResult {
		const checker = BrowserEnvironment.#createChecker(
			false,
			message,
			{
				primary  : undefined,
				secondary: undefined
			}
		);

		return {
			...BrowserEnvironment.#defaultBrowserEnvironmentResult,

			// Overwrite, failed message
			...checker
		};
	}

	/**
	 * Creates a checker object containing metadata about the data retrieval process (success, message, sources).
	 *
	 * @static
	 *
	 * @param   {boolean}                                                        isSuccess   - Whether the data retrieval was successful.
	 * @param   {string | undefined}                                             message     - A message about the retrieval process.
	 * @param   {{ primary: string | undefined; secondary: string | undefined }} dataSources - The primary and secondary sources of the data.
	 * @returns {{ checker: CheckerInfo }}                                                     An object containing the checker information.
	 */
	static #createChecker(isSuccess: boolean, message: string | undefined, dataSources: { primary: string | undefined; secondary: string | undefined }): { checker: CheckerInfo } {
		const result = {
			checker: {
				isSuccess,
				message,
				dataSources
			}
		};

		return result;
	}

	/**
	 * Creates a default template for the browser environment result, with all properties initialized to undefined.
	 *
	 * @static
	 *
	 * @returns {BrowserEnvironmentResult} The default browser environment result object.
	 */
	static #createDefaultBrowserEnvironmentResult(): BrowserEnvironmentResult {
		return {
			// checker for debugging
			checker: {
				isSuccess  : false,
				message    : undefined,
				dataSources: {
					primary  : undefined,
					secondary: undefined
				}
			},

			information: {
				// start: Data from User-Agent Client Hints -------
				browser: {
					name   : undefined,
					version: undefined
				},
				engine: {
					name   : undefined,
					version: undefined
				},
				device: {
					mobile: undefined,
					model : undefined,
				},
				cpu: {
					architecture: undefined,
					bitness     : undefined
				},
				os: {
					name       : undefined,
					version    : undefined,
					versionName: undefined
				},
				// end: Data from User-Agent Client Hints ---------

				// start: Data from User-Agent -----------------------------------------------------------
				ua: ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined,

				language: ("language" in globalThis.navigator) ? globalThis.navigator.language : undefined
				// start: Data from User-Agent -----------------------------------------------------------
			}
		};
	}

	/**
	 * Merges information from Client Hints, a parsing plugin, and checker metadata into a single result object.
	 *
	 * @param   {UserAgentClientHintsInfo | null}       clientHintsInfo - Information obtained from User-Agent Client Hints.
	 * @param   {UserAgentParserPluginParseData | null} pluginInfo      - Information obtained from the User-Agent string parsing plugin.
	 * @param   {{ checker: CheckerInfo } | null}       checker         - The checker metadata object.
	 * @returns {BrowserEnvironmentResult}                                The final, merged browser environment result.
	 */
	#createBrowserEnvironmentResult(clientHintsInfo: UserAgentClientHintsInfo | null, pluginInfo: UserAgentParserPluginParseData | null, checker: { checker: CheckerInfo } | null): BrowserEnvironmentResult {
		const information = {
			information: {
				...(BrowserEnvironment.#defaultBrowserEnvironmentResult).information,

				// Overwrite information from User-Agent Client Hints
				...(clientHintsInfo ? clientHintsInfo : {}),

				// Overwrite information from plugin (User Agent)
				...(pluginInfo ? pluginInfo : {})
			}
		};
		const result = {
			...BrowserEnvironment.#defaultBrowserEnvironmentResult,

			...(checker ? checker : {}),

			...information
		};

		return result;
	}

	/**
	 * Retrieves browser information using the User-Agent Client Hints API.
	 * It requests high-entropy values and formats the result.
	 *
	 * @returns {Promise<BrowserEnvironmentResult>} A promise that resolves to the browser environment information from Client Hints.
	 */
	async #getUserAgentClientHints(): Promise<BrowserEnvironmentResult>  {
		/**
		 * Extracts a specific property ("brand" or "version") from a list of UserAgentDataBrand objects,
		 * ignoring any placeholder brands like "Not;A Brand".
		 *
		 * @param   {UserAgentDataBrand[]} list   - The list of brand objects.
		 * @param   {"brand" | "version"}  target - The property to extract.
		 * @returns {string}                        The extracted value, or an empty string if not found.
		 */
		const getInfoFromList = (list: UserAgentDataBrand[], target: "brand" | "version") => {
			const regex = /Not.A.Brand/i;  // pattern: "Not;A Brand" or "Not)A;Brand", Will another pattern of strings be added?

			return list.reduceRight(
				(accumulator, item) => {
					if (accumulator) {
						return accumulator;
					}
					if ( !regex.test(item.brand) && item[target] ) {
						return item[target];
					}

					return accumulator;
				},
				""
			);
		};

		const agent       = globalThis?.navigator?.userAgentData as NavigatorUserAgentData;
		const detail      = await agent.getHighEntropyValues(BrowserEnvironment.#highEntropyValueHints);
		const information = {
			browser: {
				name   : getInfoFromList(detail.brands ?? [], "brand"),
				version: getInfoFromList(detail.fullVersionList ?? [], "version")
			},
			engine: {
				name   : undefined,
				version: undefined
			},
			device: {
				mobile: detail.mobile,
				model : detail.model,
			},
			cpu: {
				architecture: detail.architecture,
				bitness     : detail.bitness
			},
			os: {
				name       : detail.platform,
				version    : undefined,        // detail.platformVersion: This will be overwritten by info from #getUserAgent(), as detail.platformVersion requires extra processing.
				versionName: undefined
			}
		};
		const checker = BrowserEnvironment.#createChecker(
			true,
			"This Browser can get User-Agent Client Hints. 'navigator.userAgentData' is supported. Obtain information from navigator.userAgentData and supplement it with bowser.",
			{
				primary  : "navigator.userAgentData",
				secondary: ""
			}
		);

		return this.#createBrowserEnvironmentResult(information, null, checker);
	}

	/**
	 * Retrieves browser information using the traditional `navigator.userAgent` string.
	 * This is used as a fallback when Client Hints are not available.
	 *
	 * @returns {BrowserEnvironmentResult} The browser environment information from the User-Agent string.
	 */
	#getUserAgent(): BrowserEnvironmentResult {
		if ( !("userAgent" in globalThis.navigator) ) {
			return this.#createErrorResult("'navigator.userAgent' is not supported.");
		}

		const useLibrary = BrowserEnvironment.#parser.useLibrary;
		const pluginInfo = BrowserEnvironment.#parser.parse();
		const checker    = BrowserEnvironment.#createChecker(
			true,
			`This Browser can get User-Agent. 'navigator.userAgent' is supported. Obtain information from ${useLibrary}.`,
			{
				primary  : useLibrary,
				secondary: ""
			}
		);

		return this.#createBrowserEnvironmentResult(null, pluginInfo, checker);
	}

	/**
	 * Supplements the information gathered from User-Agent Client Hints with data from the User-Agent string parser.
	 * This is useful for filling in gaps, such as OS version names, that Client Hints may not provide.
	 *
	 * @param   {BrowserEnvironmentResult} information - The initial information gathered from Client Hints.
	 * @returns {BrowserEnvironmentResult}               The supplemented browser environment information.
	 */
	#supplementClientHintsWithUserAgent(information: BrowserEnvironmentResult): BrowserEnvironmentResult {
		const useLibrary = BrowserEnvironment.#parser.useLibrary;
		const pluginInfo = BrowserEnvironment.#parser.parse();

		information.checker.dataSources.secondary = useLibrary;

		const clientHintsInfo = information.information;
		const checker = {
			checker: information.checker
		};

		return this.#createBrowserEnvironmentResult(clientHintsInfo, pluginInfo, checker);

	}
}