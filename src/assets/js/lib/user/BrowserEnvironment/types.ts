/**
 * TypeScript type definitions for the BrowserEnvironment library.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-08
 */

// ----------------------------------------------------------------------------------------------------------------------------
// for "./index.ts"

/**
 * Defines the structure for metadata about the data retrieval process.
 */
type CheckerInfo = {
	/**
	 * Indicates whether the data retrieval was successful.
	 */
	isSuccess: boolean,
	/**
	 * A message providing details about the retrieval process (e.g., success, failure, method used).
	 */
	message: string | undefined,
	/**
	 * The sources from which the data was obtained.
	 */
	dataSources: {
		/**
		 * The primary source of information (e.g., 'navigator.userAgentData' or 'bowser').
		 */
		primary: string | undefined,
		/**
		 * The secondary source of information, used for supplementation.
		 */
		secondary: string | undefined
	}
};

/**
 * Defines the structure for information obtained from the User-Agent Client Hints API.
 */
type UserAgentClientHintsInfo = {
	/**
	 * Browser information.
	 */
	browser: {
		name   : string | undefined;
		version: string | undefined;
	};
	/**
	 * Rendering engine information.
	 */
	engine: {
		name   : string | undefined;
		version: string | undefined;
	};
	/**
	 * Device information.
	 */
	device: {
		mobile: boolean | undefined;
		model : string | undefined;
	};
	/**
	 * CPU information.
	 */
	cpu: {
		architecture: string | undefined;
		bitness     : string | undefined;
	};
	/**
	 * Operating system information.
	 */
	os: {
		name       : string | undefined;
		version    : string | undefined;
		versionName: string | undefined;
	};
};

/**
 * Defines the final, consolidated result object for browser environment information.
 */
type BrowserEnvironmentResult = {
	/**
	 * Metadata about the data retrieval process.
	 */
	checker: CheckerInfo;
	/**
	 * The collected environment information, including both Client Hints and other navigator properties.
	 */
	information: UserAgentClientHintsInfo & {
		/**
		 * The full User-Agent string from `navigator.userAgent`.
		 */
		ua: string | undefined;
		/**
		 * The browser's configured language from `navigator.language`.
		 */
		language: string | undefined;
	};
};

/**
 * Represents a brand/version pair provided by the User-Agent Client Hints API.
 */
type UserAgentDataBrand = {
	readonly brand  : string;
	readonly version: string;

	readonly [key: string]: string  // For bracket-style invocation
};

/**
 * Defines the structure of high-entropy values that can be requested from the User-Agent Client Hints API.
 */
type UserAgentDataValues = {
	readonly architecture   ?: string;
	readonly bitness        ?: string;
	readonly brands         ?: UserAgentDataBrand[];
	readonly formFactor     ?: string;
	readonly uaFullVersion  ?: string;  // deprecated in favor of fullVersionList(https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/getHighEntropyValues#uafullversion)
	readonly fullVersionList?: UserAgentDataBrand[];
	readonly model          ?: string;
	readonly mobile         ?: boolean;
	readonly platform       ?: string;
	readonly platformVersion?: string;  // detail.platformVersion would require extra processing
	readonly wow64          ?: boolean;
}

/**
 * Extends the Navigator interface to include the `userAgentData` property from the Client Hints API.
 */
type NavigatorUserAgentData = {
	readonly brands  ?: UserAgentDataBrand[];
	readonly mobile  ?: boolean;
	readonly platform?: string;

	/**
	 * Asynchronously requests high-entropy values from the browser.
	 *
	 * @param   {string[]}                     _hints - An array of strings specifying the high-entropy values to retrieve.
	 * @returns {Promise<UserAgentDataValues>}          A promise that resolves with an object containing the requested values.
	 */
	// eslint-disable-next-line no-unused-vars
	getHighEntropyValues(_hints: string[]): Promise<UserAgentDataValues>;
}
// ----------------------------------------------------------------------------------------------------------------------------



// ----------------------------------------------------------------------------------------------------------------------------
// for "./plugin/*.ts"

/**
 * Defines the structure for the metadata of a User-Agent parser plugin.
 */
type UserAgentParserPluginInformation = {  // Required fields
	name        : string;  // Name of the plugin
	useLibrary  : string;  // Name of the library used
	version     : string;  // Version: in the format x.y.z
	lastModified: string;  // Last modified: date format YYYY-MM-DD
	author      : string;  // The plugin author's name
};

/**
 * Defines the structure for the data returned by a User-Agent parser plugin.
 * It is a partial representation of `UserAgentClientHintsInfo` and allows for additional properties.
 */
type UserAgentParserPluginParseData = Partial<UserAgentClientHintsInfo> & {  // Required fields, set to undefined if not needed or not obtainable
	// Other properties (directly under the root) can also be overwritten by spread expansion due to operational specifications.
	[key: string]: unknown;
};

/**
 * Defines the interface for a User-Agent parser plugin, including its metadata and execution function.
 */
type UserAgentParserPlugin = {
	/**
	 * Metadata about the plugin.
	 */
	information: UserAgentParserPluginInformation;
	/**
	 * The function that executes the parsing logic of the plugin.
	 */
	execute: () => UserAgentParserPluginParseData | null;
};
// ----------------------------------------------------------------------------------------------------------------------------



export type {
	CheckerInfo,
	UserAgentClientHintsInfo,
	BrowserEnvironmentResult,
	UserAgentDataBrand,
	UserAgentDataValues,
	NavigatorUserAgentData,

	UserAgentParserPluginParseData,
	UserAgentParserPlugin
};