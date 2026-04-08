/**
 * Logic for filtering tabs and URLs based on user settings.
 *
 * @file
 * @lastModified 2026-04-08
 */

// WXT provided cross-browser Types.
import type { Browser } from "wxt/browser";

// Import Module
import { toUniqueArray } from "@/assets/js/utils/toUniqueArray";

// Import Types
import type { Config, Define } from "@/assets/js/types";
import type { Action }         from "./types";



/**
 * Pre-processes tab information for the copy action.
 * Performs URL deduplication and protocol filtering based on settings.
 *
 * @param   {Browser.tabs.Tab[]} tabs   - Original tab array.
 * @param   {Action}             action - Action string to execute (e.g., "copy").
 * @param   {Config}             config - User configuration object.
 * @param   {Define}             define - Predefined constant object.
 * @returns {Browser.tabs.Tab[]}          Array of tab objects with settings applied.
 */
function prepareForActionCopy(tabs: Browser.tabs.Tab[], action: Action, config: Config, define: Define): Browser.tabs.Tab[] {
	const urlList         = tabs.map(tab => tab.url).filter((url): url is string => !!url);
	const filteredUrlList = applyUrlProcessingRules(urlList, action, config, define);
	const filteredTabs    = rebuildTabsFromFilteredUrls(filteredUrlList, tabs);

	return filteredTabs;
}

/**
 * Pre-processes the URL list for the paste action.
 * Performs protocol filtering and deduplication on the URL list obtained from the clipboard based on settings.
 *
 * @param   {string[]} urlList - List of URLs to open.
 * @param   {Action}   action  - Action string to execute (e.g., "paste").
 * @param   {Config}   config  - User configuration object.
 * @param   {Define}   define  - Predefined constant object.
 * @returns {string[]}           List of URLs with settings applied.
 */
function prepareForActionPaste(urlList: string[], action: Action, config: Config, define: Define): string[] {
	const filteredUrlList = applyUrlProcessingRules(urlList, action, config, define);

	return filteredUrlList;
}

/**
 * Performs protocol filtering and deduplication based on settings.
 *
 * @param   {string[]} urlList - List of URLs to process.
 * @param   {Action}   action  - Action string to execute (e.g., "copy" or "paste").
 * @param   {Config}   config  - User configuration object.
 * @param   {Define}   define  - Predefined constant object.
 * @returns {string[]}           List of URLs with settings applied.
 */
function applyUrlProcessingRules(urlList: string[], action: Action, config: Config, define: Define): string[] {
	const isProtocolFilteringEnabled     = (action === "copy") ? config.Filtering.Protocol.Copy.enable     : config.Filtering.Protocol.Paste.enable;
	const isPatternMatchFilteringEnabled = (action === "copy") ? config.Filtering.PatternMatch.Copy.enable : config.Filtering.PatternMatch.Paste.enable;
	const isDeduplicateEnabled           = (action === "copy") ? config.Filtering.Deduplicate.Copy.enable  : config.Filtering.Deduplicate.Paste.enable;
	let   filteredUrlList                = urlList;

	// Filtering: Protocol
	filteredUrlList = filterUrlsByProtocol(filteredUrlList, isProtocolFilteringEnabled, action, config, define);

	// Filtering: URL Pattern match
	filteredUrlList = filterUrlsByPatternMatch(filteredUrlList, isPatternMatchFilteringEnabled, action, config);

	// Filtering: Deduplicate
	if (isDeduplicateEnabled) {
		const originalCount = filteredUrlList.length;
		filteredUrlList = toUniqueArray(filteredUrlList);

		if (originalCount > filteredUrlList.length) {
			console.info("INFO(filter): deduplicated urls", { action, originalCount, filteredCount: filteredUrlList.length });
		}
	}

	return filteredUrlList;
}

/**
 * Filters the URL list based on protocols.
 *
 * @param   {string[]} urlList   - List of URLs to filter.
 * @param   {boolean}  filtering - Whether to enable filtering.
 * @param   {Action}   action    - Action string executing the filtering (e.g., "copy" or "paste").
 * @param   {Config}   config    - User configuration object.
 * @param   {Define}   define    - Predefined constant object.
 * @returns {string[]}             Array of filtered URLs.
 */
function filterUrlsByProtocol(urlList: string[], filtering: boolean, action: Action, config: Config, define: Define): string[] {
	const getRegexForProtocol = (config: Config, define: Define): RegExp => {
		const protocol      = config.Filtering.Protocol.type;
		const allowProtocol = [];

		for (const key in protocol) {
			if (protocol[key as keyof typeof protocol]) {
				allowProtocol.push(key);
			}
		}
		// Additional processing for Chrome-based browsers @2024/10/15
		if (config.Filtering.Protocol.type.chrome) {
			(define.ChromiumBasedBrowser).forEach(
				(brows) => {
					allowProtocol.push(brows);
				}
			);
		}
		console.debug("DEBUG(filter): allow protocol list", { allowProtocol });

		if (allowProtocol.length) {
			const str = allowProtocol.join("|");
			const reg = `(${str}):`;

			return (new RegExp(reg, "i"));
		}

		// Returns a regular expression that never matches.
		return define.Regex.NeverMatch;
	};
	const filteringURL = (url: string) => {
		url = (url).trim();

		// Filtering: is URL ?
		const isURL = URL.canParse(url);
		if (!isURL) {
			console.debug("DEBUG(filter): filtering protocol: cannot parse url string", { url });

			return false;
		}

		// Filtering: Filtering by protocol ?
		if (!filtering) {
			return true;
		}

		// Filtering: protocol
		const protocol = (new URL(url)).protocol;
		const isMatch  = (regex).test(protocol);
		if (!isMatch) {
			console.debug("DEBUG(filter): filtering protocol: deny url", { url });

			return false;
		}

		// Passed all checks
		return true;
	};
	const getArrayDiff = (original: string[], target: string[]): string[] => {
		const diff: string[] = [];

		(original).forEach(
			(elm) => {
				const exist = (target).includes(elm);

				if (!exist) {
					diff.push(elm);
				}
			}
		);

		return diff;
	};

	const regex    = getRegexForProtocol(config, define);
	const list     = structuredClone(urlList);
	const filtered = (list).filter(filteringURL);
	const result   = (filtered).map((url) => { return url.trim(); });
	const diff     = getArrayDiff(urlList, result);  // Gets the difference between urlList and result arrays >> for debugging.

	console.debug(
		"DEBUG(filter): filtering process details",
		{
			list: {
				before: urlList,  // Array of URLs from all tabs
				after : result,   // Array of filtered URLs
				diff  : diff      // Array difference >> comparison between all tab URLs and filtered URLs
			},
			action   : action,
			filtering: filtering,
			regex
		}
	);

	return result;
}

/**
 * Filters the URL list based on a filtering list.
 *
 * @param   {string[]} urlList   - List of URLs to filter.
 * @param   {boolean}  filtering - Whether to enable filtering.
 * @param   {Action}   action    - Action string executing the filtering (e.g., "copy" or "paste").
 * @param   {Config}   config    - User configuration object.
 * @returns {string[]}             Array of filtered URLs.
 */
function filterUrlsByPatternMatch(urlList: string[], filtering: boolean, action: Action, config: Config): string[] {
	/**
	 * Escapes special characters so the string can be used in a regular expression.
	 *
	 * @param   {string} str - The string to escape.
	 * @returns {string}       The escaped string.
	 */
	const escapeRegExp = (str: string): string => {
		return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	};

	const currentUrlList = structuredClone(urlList);

	// Step 01: Gets patterns and excludes empty lines and comment lines (// ).
	const text     = (config.Filtering.PatternMatch.pattern).replace(/\r\n|\r/g, "\n").replace(/\n+$/, "");
	const patterns = (text.split("\n")).filter((elm) => { return (elm !== undefined && elm !== null && elm !== "" && !(/^[\\/]{2}\s/).test(elm)); });

	if (!filtering || patterns.length === 0) {
		console.debug("DEBUG(filter): filtering by pattern match: disabled or no patterns");
		return currentUrlList;
	}

	// Step 02: Filter URLs according to matchType
	const matchType = config.Filtering.PatternMatch.type;
	let   result: string[];

	try {
		const regexParts = patterns.map(
			(pattern) => {
				if (pattern === "") {
					return null;  // Ignore empty patterns
				}

				switch (matchType) {
					case "prefix":
						return `^${escapeRegExp(pattern)}`;
					case "substring":
						return escapeRegExp(pattern);
					case "exact":
						return `^${escapeRegExp(pattern)}$`;
					case "regex":
						return pattern;
					default: {
						const exhaustiveCheck: never = matchType;
						throw new Error(`Error: unknown matchType "${exhaustiveCheck}" in filterUrlsByPatternMatch`);
					}
				}
			})
			.filter((ptn): ptn is string => ptn !== null);

		if (regexParts.length === 0) {
			return currentUrlList;
		}

		const combinedRegex = new RegExp(regexParts.join("|"), "i");
		result = currentUrlList.filter(url => !combinedRegex.test(url));

	} catch (error) {
		console.error("ERROR(filter): invalid regex pattern provided, filtering disabled", error);
		return currentUrlList;
	}

	console.debug("DEBUG(filter): filtering by pattern match results", { config, patterns, url: { before: urlList, after: result } });

	return result;
}

/**
 * Efficiently reconstructs a tab array maintaining order based on the filtered URL list and the original tab array.
 *
 * @param   {string[]}           urls         - Filtered list of URLs.
 * @param   {Browser.tabs.Tab[]} originalTabs - Complete list of original tabs.
 * @returns {Browser.tabs.Tab[]}                Reconstructed tab array.
 */
function rebuildTabsFromFilteredUrls(urls: string[], originalTabs: Browser.tabs.Tab[]): Browser.tabs.Tab[] {
	// Creates a Map object with URLs as keys and tabs as values to enable O(1) access and reduce the number of loops.
	const urlToTabMap = new Map<string, Browser.tabs.Tab>();

	for (const tab of originalTabs) {
		if (tab.url) {
			urlToTabMap.set(tab.url, tab);
		}
	}

	// Reconstructs the tab array based on the filtered and ordered URL list.
	const resultTabs = urls.map(url => urlToTabMap.get(url)).filter((tab): tab is Browser.tabs.Tab => tab !== undefined);

	return resultTabs;
};



export {
	prepareForActionCopy,
	prepareForActionPaste
};