/**
 * 機能      : DOM操作に関するユーティリティ機能を提供します（親ノードの確認、HTMLエスケープ、CSSルールの取得、textareaの自動高さ調整）。
 * 依存関係  : なし (DOM APIを使用)
 * 最終更新日: 2025年8月12日
 */

function hasParentNode(elm) {
	const parent = elm.parentNode;
	const obj    = {
		elm  : parent,
		hasP : Object.hasOwn(parent, "nodeName"),
		name : (parent.nodeName).toLowerCase(),
		isA  : (parent.nodeName).toLowerCase() === "a",
		href : parent.href
	};

	console.log("Has parentNode ?", obj);

	return obj;
}

/*
	escape と encodeURI と encodeURIComponent を正しく使い分ける(https://aloerina01.github.io/blog/2017-04-28-1)
*/
function escapeHTML(str) {
	if (typeof str !== "string") {
		return str;
	}

	return (str).replace(/[&'`"<>]/g, (match) => {
		return {
			"&" : "&amp;",
			"'" : "&#x27;",
			"`" : "&#x60;",
			"\"" : "&quot;",
			"<" : "&lt;",
			">" : "&gt;"
		}[match];
	});
}

/*
	指定セレクタのCSSルールを取得する(https://qiita.com/life5618/items/950558e4b72c038333f8)
	呼び出し例 getRuleBySelector(".inner1")  selector に CSSセレクタ
*/
function getRuleBySelector(selector) {
	let rule = null;

	// stylesheetのリストを取得
	const sheets = document.styleSheets;

	for (let i = 0; i < sheets.length; i++) {
		// そのstylesheetが持つCSSルールのリストを取得
		const rules = sheets[i].cssRules;

		for (let j = 0; j < rules.length; j++) {
			// セレクタが一致するか調べる
			if (selector === rules[j].selectorText) {
				rule = rules[j];
				break;
			}
		}
	}

	return rule;
}

/*
	textareaの高さを計算して自動で可変(https://web-dev.tech/front-end/javascript/textarea-auto-height/)
*/
function setTextareaHeightAutomatically(event) {
	const self = event.currentTarget;

	self.style.height = "auto";
	self.style.height = `${this.scrollHeight}px`;
}

export { hasParentNode, escapeHTML, getRuleBySelector, setTextareaHeightAutomatically };