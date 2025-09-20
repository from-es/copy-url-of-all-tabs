import DOMPurify                          from "dompurify"; // Import NPM Package
import { type Config as DOMPurifyConfig } from "dompurify"; // Import Types

/**
 * innerHTML の代わりに、サニタイズ処理と replaceChildren を使って安全にHTML文字列を要素にセットする
 *
 * @param {Element}                   element    - コンテンツをセットする対象のDOM要素
 * @param {string | null | undefined} htmlString - 描画したいHTML文字列。nullまたは空文字の場合、要素内はクリアされる
 * @param {DOMPurifyConfig}           options    - DOMPurify の設定オプション
 */
export function setSafeHTML(element: Element, htmlString: string | null | undefined, options?: DOMPurifyConfig): void {
	if (!element) {
		console.error("setSafeHTML: Target element is not provided.");
		return;
	}

	if (!htmlString) {
		element.replaceChildren();
		return;
	}

	const sanitizedDocument = createSafeDOM(htmlString, options);

	element.replaceChildren(...sanitizedDocument.body.childNodes);
}

/**
 * Sanitizes an HTML string and parses it into a Document object.
 * This is useful when you need to manipulate the DOM structure before inserting it into the page.
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
	const sanitizedHTML = DOMPurify.sanitize(htmlString, options ?? {});

	return sanitizedHTML;
}