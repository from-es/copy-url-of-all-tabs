/*
	Convert Markdown to HTML for "Update history"
*/

import { marked } from "./marked.esm.js";

window.addEventListener("load", main);



async function main() {
	const markdown = await getMarkdown();
	const html     = marked.parse(markdown);

	setHTMLtoLatest(html)

	setHTMLtoPast(html);
}

async function getMarkdown() {
	const url = "./log.md";

	const response = await fetch(url, { cache: "no-store"});
	const result   = (response.ok) ? await response.text() : undefined;

	if ( !response.ok ) {
		const message = `Error, Not Found url: ${url}. HTTP error! Status: ${response.status}`;

		throw new Error(message);
	}

	return result;
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