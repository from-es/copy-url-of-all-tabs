/**
 * Searches all style sheets in the document and returns the first CSS rule that matches the specified CSS selector.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Searches all style sheets in the document and returns the first CSS rule that matches the specified CSS selector.
 *
 * @param   {string}         selector - The CSS selector string to search for (e.g., ".class", "#id")
 * @returns {CSSRule | null}            The matching CSS rule object, or null if none is found
 *
 * @see https://qiita.com/life5618/items/950558e4b72c038333f8
 * @example
 * const rule = getRuleBySelector('.my-class');
 * if (rule) {
 *   console.debug('DEBUG(dom): rule style color', { color: rule.style.color });
 * }
 */
export function getRuleBySelector(selector: string): CSSRule | null {
	let rule: CSSRule | null = null;

	// Get the list of style sheets
	const sheets = document.styleSheets;

	for (let i = 0; i < sheets.length; i++) {
		// Get the list of CSS rules from each stylesheet
		const rules = sheets[i].cssRules;

		for (let j = 0; j < rules.length; j++) {
			// Check if the selector matches
			if (selector === (rules[j] as CSSStyleRule).selectorText) {
				rule = rules[j];
				break;
			}
		}
	}

	return rule;
}