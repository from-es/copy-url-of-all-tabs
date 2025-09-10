/**
 * ドキュメント内の全スタイルシートを検索し、指定されたCSSセレクタに一致する最初のCSSルールを返す
 *
 * @param {string} selector  - 検索するCSSセレクタ文字列（例: ".class", "#id"）
 * @returns {CSSRule | null} - 見つけたCSSルールオブジェクト、見つからない場合は null
 * @see https://qiita.com/life5618/items/950558e4b72c038333f8
 * @example
 * const rule = getRuleBySelector('.my-class');
 * if (rule) {
 *   console.log(rule.style.color);
 * }
 */
export function getRuleBySelector(selector: string): CSSRule | null {
	let rule: CSSRule | null = null;

	// stylesheetのリストを取得
	const sheets = document.styleSheets;

	for (let i = 0; i < sheets.length; i++) {
		// そのstylesheetが持つCSSルールのリストを取得
		const rules = sheets[i].cssRules;

		for (let j = 0; j < rules.length; j++) {
			// セレクタが一致するか調べる
			if (selector === (rules[j] as CSSStyleRule).selectorText) {
				rule = rules[j];
				break;
			}
		}
	}

	return rule;
}