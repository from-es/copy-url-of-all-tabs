/**
 * Utility for calculating delay times for a list of URLs.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

/**
 * Rule for defining delay time for a specific URL pattern.
 */
interface UrlDelayRule {
	/**
	 * URL pattern to match.
	 */
	pattern: string | RegExp;
	/**
	 * Matching type when the pattern is a string.
	 * - 'prefix'   : Prefix match (e.g., matches "https://example.com/")
	 * - 'substring': Substring match (e.g., matches "example")
	 * - 'exact'    : Exact match (e.g., matches "https://example.com/page" exactly)
	 * This property is ignored if the pattern is a RegExp object.
	 */
	matchType?: "prefix" | "substring" | "exact";
	/**
	 * Delay (in milliseconds) to apply when the pattern matches.
	 */
	delay: number;
}

/**
 * Result object for URL list delay calculation.
 */
interface UrlDelayCalculationResult {
	/**
	 * The URL.
	 */
	url: string;
	/**
	 * Delay information for the URL.
	 */
	delay: {
		/**
		 * Cumulative delay (in milliseconds) from the start of the sequence. Used for setTimeout, etc.
		 */
		cumulative: number;
		/**
		 * Individual delay (in milliseconds) before processing this specific URL. Used for wait times between asynchronous steps.
		 */
		individual: number;
	};
}

/**
 * Internal interface that extends UrlDelayRule to hold the compiled RegExp object.
 *
 * @interface CompiledUrlDelayRule
 * @property  {RegExp} compiledPattern - Compiled regular expression object.
 */
interface CompiledUrlDelayRule extends UrlDelayRule {
	compiledPattern: RegExp;
}



/**
 * Utility class providing static methods to calculate delay times for a list of URLs.
 */
class UrlDelayCalculator {
	/**
	 * This class is stateless and does not need to be instantiated.
	 * All functionality is provided through the static method `calculate`.
	 */
	private constructor() { /* private constructor to prevent instantiation */ }

	/**
	 * Escapes special characters in a string for use in a regular expression.
	 *
	 * @param   {string} str - The string to escape.
	 * @returns {string}     - The escaped string.
	 */
	static #escapeRegExp(str: string): string {
		return str.replace(/[.*+?^${}()|[\\][\\]\\]/g, "\\$&");
	}

	/**
	 * Converts an array of UrlDelayRule into an internal array of rules with pre-compiled regular expressions.
	 *
	 * @param   {UrlDelayRule[]}         customRules - An array of custom delay rules defined by the user.
	 * @returns {CompiledUrlDelayRule[]}             - An array of compiled rules.
	 */
	static #compileRules(customRules: UrlDelayRule[]): CompiledUrlDelayRule[] {
		return customRules.map(
			(rule) => {
				if (rule.pattern instanceof RegExp) {
					return { ...rule, compiledPattern: rule.pattern };
				}

				if (typeof rule.pattern !== "string" || rule.pattern.length === 0) {
					console.warn("WARN(tab): Invalid: invalid or empty string pattern in custom delay rule, rule ignored", { rule });

					return { ...rule, compiledPattern: /(?!)/ };  // Returns a regular expression that matches nothing for invalid patterns.
				}

				const escapedPattern = UrlDelayCalculator.#escapeRegExp(rule.pattern);
				let   regex: RegExp;

				switch (rule.matchType) {
					case "substring":
						regex = new RegExp(escapedPattern, "i");
						break;
					case "exact":
						regex = new RegExp(`^${escapedPattern}$`, "i");
						break;
					case "prefix":
						// 'prefix' matches 'default' behavior, so fall through.
						// eslint-disable-next-line no-fallthrough
					default:
						regex = new RegExp(`^${escapedPattern}`, "i");
						break;
				}

				return { ...rule, compiledPattern: regex };
			}
		);
	}

	/**
	 * Executes the delay calculation for a list of URLs based on compiled rules.
	 *
	 * @param   {string[]}                    urls          - List of URLs to process.
	 * @param   {CompiledUrlDelayRule[]}      compiledRules - An array of compiled rules.
	 * @param   {number}                      defaultDelay  - Default delay time (in milliseconds).
	 * @param   {number}                      applyFrom     - The match count at which to start applying custom delays.
	 * @returns {UrlDelayCalculationResult[]}               - An array of calculation result objects.
	 */
	static #processDelayCalculation(urls: string[], compiledRules: CompiledUrlDelayRule[], defaultDelay: number, applyFrom: number): UrlDelayCalculationResult[] {
		const results: UrlDelayCalculationResult[] = [];
		const ruleMatchCount                       = new Map<RegExp, number>();
		let   cumulativeDelay                      = 0;

		for (let i = 0; i < urls.length; i++) {
			const url             = urls[i];
			let   individualDelay = (i === 0) ? 0 : defaultDelay;

			for (const rule of compiledRules) {
				if (rule.compiledPattern.test(url)) {
					const matchCount = ruleMatchCount.get(rule.compiledPattern) || 0;

					if (matchCount + 1 >= applyFrom) {
						individualDelay = rule.delay;
					}

					ruleMatchCount.set(rule.compiledPattern, matchCount + 1);
					break;
				}
			}

			cumulativeDelay += individualDelay;

			results.push({
				url,
				delay: {
					cumulative: cumulativeDelay,
					individual: individualDelay
				}
			});
		}

		return results;
	}

	/**
	 * Calculates the cumulative and individual delays for each URL in the list based on a default delay and custom rules.
	 *
	 * @param   {string[]}                    urls         - List of URLs to process.
	 * @param   {number}                      defaultDelay - Default delay (in milliseconds) between opening URLs.
	 * @param   {UrlDelayRule[]}              customRules  - (Optional) An array of custom delay rules.
	 * @param   {number}                      applyFrom    - (Optional) The match count from which to apply custom delays. e.g., specifying 2 applies it from the second match. Default is 1.
	 * @returns {UrlDelayCalculationResult[]}              - A list of objects containing each URL and its delay information.
	 */
	static calculate(urls: string[], defaultDelay: number, customRules: UrlDelayRule[] = [], applyFrom: number = 1): UrlDelayCalculationResult[] {
		const compiledRules = UrlDelayCalculator.#compileRules(customRules);
		const results       = UrlDelayCalculator.#processDelayCalculation(urls, compiledRules, defaultDelay, applyFrom);

		return results;
	}
}



export {
	UrlDelayCalculator
};
export type {
	UrlDelayRule,
	UrlDelayCalculationResult
};