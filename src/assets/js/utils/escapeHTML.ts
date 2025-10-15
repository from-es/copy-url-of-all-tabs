/**
 * HTML特殊文字をエスケープして、クロスサイトスクリプティング(XSS)を防ぐ
 * `&`, `'`, `` ` ``, `"`, `<`, `>` を対応するHTMLエンティティに変換
 *
 * @lastupdate 2025/10/15
 * @see https://aloerina01.github.io/blog/2017-04-28-1
 *
 * @param   {T}          target - エスケープする値。文字列でない場合はそのまま返す
 * @returns {T | string}        - エスケープされた安全なHTML文字列、または元の値
 */
export function escapeHTML<T>(target: T): T | string {
	if (typeof target !== "string") {
		console.error("Error, Invalid argument passed to escapeHTML(target). Expected a string but a non-string value was provided.", { typeof: typeof target, value: target });

		return target;
	}

	const escapeRegex = /[&'`"<>]/g;
	const escapes: { [key: string]: string } = {
		"&" : "&amp;",
		"'" : "&#x27;",
		"`" : "&#x60;",
		"\"": "&quot;",
		"<" : "&lt;",
		">" : "&gt;"
	};

	return target.replace(escapeRegex, (match) => escapes[match]);
}