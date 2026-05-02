/**
 * Plugin for UserAgentParser that parses User-Agent strings using the Bowser library.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-08
 *
 * @dependency bowser (https://github.com/bowser-js/bowser)
 */

// Import NPM Package
import Bowser from "bowser";

// Import Types
import type { UserAgentParserPlugin, UserAgentParserPluginParseData } from "../types";



/**
 * A User-Agent parser plugin that utilizes the Bowser library.
 * It provides metadata about the plugin and an execution function to perform the parsing.
 *
 * @dependency bowser (https://github.com/bowser-js/bowser)
 */
const UserAgentParserPlugin: UserAgentParserPlugin = {
	information: {
		name        : "UserAgent parser plugin using bowser",
		useLibrary  : "bowser",
		version     : "1.0.1",
		lastModified: "2026-04-08",
		author      : "From E"
	},

	/**
	 * The main execution function for the plugin.
	 * It calls the internal `parseInformation` function to perform the parsing.
	 *
	 * @returns {UserAgentParserPluginParseData | null} The parsed user agent data, or null if parsing fails.
	 */
	execute: (): UserAgentParserPluginParseData | null => {
		return parseInformation();
	}
};

/**
 * This function is responsible for retrieving information from the library and parsing it.
 * The processing within this function is tightly coupled with the library.
 *
 * @returns {UserAgentParserPluginParseData | null} The parsed data from the User-Agent string, or null if it cannot be parsed.
 */
function parseInformation(): UserAgentParserPluginParseData | null {
	const userAgent = ("userAgent" in globalThis.navigator) ? globalThis.navigator.userAgent : undefined;

	if (!userAgent) {
		return null;
	};

	// Library dependent, start --------------------------------------------------
	const agent  = Bowser.getParser(userAgent);
	const info   = agent.getResult();

	if (!info || !(typeof info === "object" && Object.keys(info).length > 0)) {
		return null;
	}

	// Access properties using optional chaining for safety
	const result = {
		browser: {
			name   : info?.browser?.name,
			version: info?.browser?.version
		},
		engine: {
			name   : info?.engine?.name,
			version: info?.engine?.version
		},
		os: {
			name       : info?.os?.name,
			version    : info?.os?.version,
			versionName: info?.os?.versionName
		}
	};
	// Library dependent, end --------------------------------------------------

	return result;
}



export { UserAgentParserPlugin };