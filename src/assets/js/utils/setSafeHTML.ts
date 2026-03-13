import DOMPurify                          from "dompurify"; // Import NPM Package
import { type Config as DOMPurifyConfig } from "dompurify"; // Import Types

/**
 * innerHTML の代わりに、サニタイズ処理と replaceChildren を使って安全にHTML文字列を要素にセットする
 *
 * @param {Element}                   element    - コンテンツをセットする対象のDOM要素。対象要素の子要素（複数対応）を置き換える
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

	const isEmpty = isEmptyString(htmlString);

	// 第2引数に null, undefined, 空文字、または空白のみの文字列を渡された場合、要素の子要素をクリアする
	if (isEmpty) {
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
 * @param   {string | null | undefined} htmlString - サニタイズするHTML文字列。null, undefined, 空文字、または空白のみ文字列の場合、空の Document を返す
 * @param   {DOMPurifyConfig}           options    - DOMPurify の設定オプション
 * @returns {Document}                             - サニタイズされたドキュメントオブジェクト
 */
export function createSafeDOM(htmlString: string | null | undefined, options?: DOMPurifyConfig): Document {
	const sanitizedHTML = createSafeHTML(htmlString, options);
	const parser        = new DOMParser();
	const doc           = parser.parseFromString(sanitizedHTML, "text/html");

	return doc;
}

/**
 * HTML文字列をサニタイズし、サニタイズされたHTML文字列を返す
 *
 * @param   {string | null | undefined} htmlString - サニタイズするHTML文字列。null, undefined, 空文字、または空白のみ文字列の場合、空文字を返す
 * @param   {DOMPurifyConfig}           options    - DOMPurify の設定オプション
 * @returns {string}                               - サニタイズされたHTML文字列
 */
export function createSafeHTML(htmlString: string | null | undefined, options?: DOMPurifyConfig): string {
	const isEmpty = isEmptyString(htmlString);

	if (isEmpty) {
		return "";
	}

	// TypeScript の型定義だけでは、実行時に予期せぬ型（オブジェクト等）が渡されるのを防げない為、
	// DOMPurify に渡す前に検証（明示的な型チェックとバリデーション）を行う
	validateArguments(htmlString, options);

	const sanitizedHTML = DOMPurify.sanitize(htmlString as string, options ?? {});

	return sanitizedHTML;
}

/**
 * 文字列が空（null, undefined, 空文字、または空白のみ文字列）であるか判定
 *
 * @param   {unknown} value - 判定対象の値
 * @returns {boolean}       - 空であれば true, それ以外は false
 */
function isEmptyString(value: unknown): boolean {
	const isEmpty = !value || (typeof value === "string" && value.trim().length === 0);

	return isEmpty;
}

/**
 * createSafeHTML() へ渡す引数を検証
 *
 * @param  {unknown}   htmlString - サニタイズ対象のHTML文字列
 * @param  {unknown}   options    - DOMPurify の設定オプション
 * @throws {TypeError}            - htmlString が文字列でない場合、または options がオブジェクトでない場合にスロー
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