/**
 * HTML特殊文字をエスケープして、クロスサイトスクリプティング(XSS)を防ぐ
 * `&`, `'`, `` ` ``, `"`, `<`, `>` を対応するHTMLエンティティに変換
 *
 * @param   {string} target - エスケープする文字列
 * @returns {string}        - エスケープされた安全なHTML文字列
 * @see https://aloerina01.github.io/blog/2017-04-28-1
 */
export function escapeHTML(target: string): string {
	if (typeof target !== "string") {
		// debug
		console.error("Error, Invalid value passed to escapeHTML(target). The argument passed is not a string >>", { typeof: typeof target, value: target });

		return target;
	}

	const regex_escapeString = /[&'`"<>]/g;

	return (target).replace(regex_escapeString, (match) => {
		return {
			"&": "&amp;",
			"'": "&#x27;",
			"`": "&#x60;",
			'"': "&quot;",
			"<": "&lt;",
			">": "&gt;"
		}[match] || "";
	});
}