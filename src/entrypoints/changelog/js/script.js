/*
	Convert Markdown to HTML for "Update history"
*/

import { marked } from "marked";

window.addEventListener("load", main);



async function main() {
	// 履歴ファイル(log.md)は、静的ファイルを置くディレクトリィ内("src/public/src/text/changelog.md")に置いてある為、コード or 設置場所変更時は注意
	const filePath = "src/text/changelog.md";

	const markdown     = await getMarkdown(filePath);
	const markedCustom = openExternalLinkInNewTab(marked);
	const html         = markedCustom.parse(markdown);

	setHTMLtoLatest(html);

	setHTMLtoPast(html);
}

async function getMarkdown(path) {
	const url = chrome.runtime.getURL(path);

	const response = await fetch(url, { cache: "no-store"});
	const result   = (response.ok) ? await response.text() : undefined;

	if ( !response.ok ) {
		const message = `Error, Not Found url: ${url}. HTTP error! Status: ${response.status}`;

		throw new Error(message);
	}

	return result;
}


/**
 * Overwrite renderer.link, Open external link in new tab
 * modified https://github.com/markedjs/marked/issues/655#issuecomment-712380889
 */
function openExternalLinkInNewTab(marked) {
	const renderer = {
		link({ href, title, text }) {
			/**
			 * @param   {string} href
			 * @param   {string} title
			 * @param   {string} text
			 * @returns {string} - Anchor HTML text
			 */
			const buildAnchorText = (href, title, text) => {
				const localLink = href.startsWith(`${location.protocol}//${location.hostname}`);

				// to avoid title=null or title=undefined
				if (title) {
					return localLink
						? `<a href="${href}" title="${title}">${text}</a>`
						: `<a href="${href}" title="${title}" target="_blank" rel="noopener noreferrer">${text}</a>`;
				} else {
					return localLink
						? `<a href="${href}" title="${href}">${text}</a>`
						: `<a href="${href}" title="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
				}
			};

			const anchorText = buildAnchorText(href, title, text);

			return anchorText;
		},
	};

	marked.use({ renderer });

	return marked;
}

/**
 * @param {string} html
 */
function setHTMLtoLatest(html) {
	const selector = "#latest";
	const header   = "h4";
	const number   = 3; // 最新表示件数

	const doc     = (new DOMParser()).parseFromString(html, "text/html");
	const history = doc.querySelectorAll(header);
	const loop    = (history.length > number) ? number : history.length;
	let   latest  = "";

	for (let i = 0; i < loop; i++) {
		const h4 = history[i];
		const ul = h4.nextElementSibling;

		latest += (h4.outerHTML + ul.outerHTML);
	}

	document.querySelector(selector).innerHTML = latest;
}

/**
 * @param {string} html
 */
function setHTMLtoPast(html) {
	const selector = "#marked";

	document.querySelector(selector).innerHTML = html;
}