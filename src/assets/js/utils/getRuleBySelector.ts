/**
 * Searches all style sheets in the document and returns the first CSS rule that matches the specified CSS selector.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Internal function to iterate through all style sheets and find a matching rule.
 * This handles CORS/SecurityError gracefully by skipping inaccessible sheets.
 *
 * @param   {string}         selector - The CSS selector string to search for.
 * @returns {CSSRule | null}            The first matching CSS rule, or null if not found.
 */
function findRuleInStyleSheets(selector: string): CSSRule | null {
	const sheets = document.styleSheets;

	for (let i = 0; i < sheets.length; i++) {
		try {
			// Accessing cssRules may throw SecurityError if the stylesheet is cross-origin
			const rules = sheets[i].cssRules;

			for (let j = 0; j < rules.length; j++) {
				const rule = rules[j];
				// Check if the selector matches (considering it as a CSSStyleRule)
				if (selector === (rule as CSSStyleRule).selectorText) {
					return rule;
				}
			}
		} catch (error) {
			// Catch CORS restriction errors (SecurityError) and skip the stylesheet
			console.debug("DEBUG(dom): Skipping stylesheet due to access restriction (CORS/SecurityError)", {
				href: sheets[i].href,
				error
			});
			continue;
		}
	}

	return null;
}

/**
 * Searches all style sheets in the document and returns the first CSS rule that matches the specified CSS selector.
 * Note: Stylesheets that are inaccessible due to CORS (SecurityError) will be skipped.
 *
 * @param   {string}         selector - The CSS selector string to search for (e.g., ".class", "#id")
 * @returns {CSSRule | null}            The matching CSS rule object, or null if none is found or if access is restricted
 * @throws  {TypeError}                 Thrown if the argument is not a string
 *
 * @see https://qiita.com/life5618/items/950558e4b72c038333f8
 * @example
 * const rule = getRuleBySelector('.my-class');
 * if (rule) {
 *   console.debug('DEBUG(dom): rule style color', { color: rule.style.color });
 * }
 */
export function getRuleBySelector(selector: string): CSSRule | null {
	if (typeof selector !== "string" || selector.trim() === "") {
		console.debug("DEBUG(dom): Invalid: argument 'selector' must be a non-empty string", { selector });
		throw new TypeError("Invalid: argument 'selector' must be a non-empty string");
	}

	return findRuleInStyleSheets(selector);
}