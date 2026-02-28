import DOMPurify                          from "dompurify"; // Import NPM Package
import { type Config as DOMPurifyConfig } from "dompurify"; // Import Types

/**
 * innerHTML の代わりに、サニタイズ処理と replaceChildren を使って安全にHTML文字列を要素にセットする
 *
 * @param {Element}                   element    - コンテンツをセットする対象のDOM要素
 * @param {string | null | undefined} htmlString - 描画したいHTML文字列。null, undefined, 空文字の場合、要素内はクリアされる
 * @param {DOMPurifyConfig}           options    - DOMPurify の設定オプション
 */
export function setSafeHTML(element: Element, htmlString: string | null | undefined, options?: DOMPurifyConfig): void {
	if (!element) {
		throw new TypeError("Invalid: target element is not provided in setSafeHTML");
	}
	if (!(element instanceof Element)) {
		throw new TypeError("Invalid: target element must be an instance of Element in setSafeHTML");
	}

	if (!htmlString) {
		element.replaceChildren();
		return;
	}

	const sanitizedDocument = createSafeDOM(htmlString, options);

	element.replaceChildren(...sanitizedDocument.body.childNodes);
}

/**
 * HTML文字列をサニタイズし、Document オブジェクトにパース
 * DOM 構造をページに挿入する前に操作する必要がある場合に使用
 *
 * @param   {string}   htmlString - サニタイズするHTML文字列
 * @returns {Document}            - サニタイズされたドキュメントオブジェクト
 */
export function createSafeDOM(htmlString: string, options?: DOMPurifyConfig): Document {
	const sanitizedHTML = createSafeHTML(htmlString, options);
	const parser        = new DOMParser();
	const doc           = parser.parseFromString(sanitizedHTML, "text/html");

	return doc;
}

/**
 * HTML文字列をサニタイズし、サニタイズされたHTML文字列を返す
 *
 * @param   {string}          htmlString - サニタイズするHTML文字列
 * @param   {DOMPurifyConfig} options    - DOMPurify の設定オプション
 * @returns {string}                     - サニタイズされたHTML文字列
 */
export function createSafeHTML(htmlString: string, options?: DOMPurifyConfig): string {
	if (typeof htmlString === "string" && htmlString.length === 0) {
		return "";
	}

	validateArguments(htmlString, options);

	const sanitizedHTML = DOMPurify.sanitize(htmlString, options ?? {});

	return sanitizedHTML;
}

/**
 * createSafeHTML() へ渡す引数を検証
 * @param  {unknown}   htmlString - サニタイズ対象のHTML文字列
 * @param  {unknown}   options    - DOMPurify の設定オプション
 * @throws {TypeError}            - 引数が不正な場合にスローされる
 */
function validateArguments(htmlString: unknown, options: unknown): void {
	// htmlString: 文字列であるか
	if (typeof htmlString !== "string") {
		throw new TypeError(`Invalid: argument "htmlString" must be a string, but received type ${typeof htmlString} in validateArguments`);
	}

	// options: DOMPurify の設定オプションとして有効か
	// typeof [] は "object" となるため、Array.isArray で配列を除外するチェックが必須
	if (options !== undefined && (typeof options !== "object" || options === null || Array.isArray(options))) {
		throw new TypeError(`Invalid: argument "options" must be an object, but received ${options === null ? "null" : `type ${typeof options}`} in validateArguments`);
	}
}