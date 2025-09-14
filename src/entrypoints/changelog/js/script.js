/*
	Convert Markdown to HTML for "Update history"
*/

// Import from Script
import { initializeConfig } from "@/assets/js/initializeConfig";

// Import NPM Package
import { marked } from "marked";

// 設定値
const CHANGELOG_PATH              = "src/text/changelog.md"; // 変更履歴ファイルのパス、静的ファイル用のディレクトリィ内に設置
const LATEST_HISTORY_SELECTOR     = "#latest";               // 最新の履歴を表示する要素のセレクタ
const PAST_HISTORY_SELECTOR       = "#marked";               // 全ての履歴を表示する要素のセレクタ
const ERROR_NOTIFICATION_SELECTOR = "#contents .entry";      // エラーメッセージを表示する要素のセレクタ
const HISTORY_HEADER_TAG          = "h4";                    // 履歴の各バージョンを識別するヘッダータグ
const LATEST_HISTORY_COUNT        = 3;                       // 最新の履歴として表示する件数

// 外部リンクを新しいタブで開くように設定された marked のカスタムレンダラー
const customLinkRenderer = {
	link({ href, title, text }) {
		let   isLocalLink = false;
		const linkTitle   = title ? `title="${title}"` : `title="${href}"`;

		try {
			// href が相対パスの場合でも、location.href を基準に絶対URLに変換
			const url = new URL(href, location.href);

			// 変換後のURLのオリジンが現在のページのオリジンと同じか、または href がページ内アンカーの場合をローカルリンクと判定
			isLocalLink = (url.origin === location.origin) || href.startsWith("#");
		} catch (error) {
			// URLのパースに失敗した場合はローカルリンクではないと判断し、外部リンクとして処理
			isLocalLink = false;

			console.error("Failed to parse URL or determine link type:", href, error);
		}

		if (isLocalLink) {
			return `<a href="${href}" ${linkTitle}>${text}</a>`;
		}  else {
			return `<a href="${href}" ${linkTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;
		}
	},
};

window.addEventListener("load", main);



async function main() {
	await initialize();
	await setUpdateHistory();
}

async function initialize() {
	const { config } = await initializeConfig(null);

	// スタイル(style.css >> :root要素)の動的書き換え
	const fontSize = config.OptionsPage.fontsize;
	document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);
}

async function setUpdateHistory() {
	try {
		const markdown     = await getMarkdown(CHANGELOG_PATH);
		const markedCustom = createCustomMarkedInstance();
		const html         = markedCustom.parse(markdown);
		const doc          = new DOMParser().parseFromString(html, "text/html");

		renderLatestHistory(doc);
		renderPastHistory(html);

	} catch (error) {
		console.error("Failed to display changelog:", error);

		const elm = document.querySelector(ERROR_NOTIFICATION_SELECTOR) || document.body;
		elm.innerHTML = `<p>Failed to load changelog.</p><p>Error: ${error.message}</p>`;
	}
}

/**
 * Markdown ファイルを取得
 * @param   {string} path     - ファイルパス
 * @returns {Promise<string>} - Markdown 文字列
 */
async function getMarkdown(path) {
	const url = browser.runtime.getURL(path);
	try {
		const response = await fetch(url, { cache: "no-store" });

		// ファイルが存在しない場合 (e.x. 404 Not Found) を明示的にチェック
		if (response.status === 404) {
			throw new Error(`Markdown file not found. (path: ${path})`);
		}

		// その他のHTTPエラー
		if (!response.ok) {
			throw new Error(`Failed to retrieve Markdown file: ${url} (Status: ${response.status})`);
		}

		return response.text();
	} catch (error) {
		// fetch が Promise を reject した場合（ネットワークエラーなど）
		if (error instanceof TypeError && error.message === "Failed to fetch") {
			throw new Error(`Network error or file not accessible: ${url}. Original error: ${error.message}`);
		} else {
			// その他の予期せぬエラー、または上記で throw されたカスタムエラー
			throw error;
		}
	}
}

/**
 * 外部リンクを新しいタブで開くように設定された marked インスタンスを返す
 *
 * Overwrite renderer.link, Open external link in new tab
 * https://github.com/markedjs/marked/issues/655#issuecomment-712380889
 *
 * @returns {import("marked").Marked}
 */
function createCustomMarkedInstance() {
	return marked.use({ renderer: customLinkRenderer });
}

/**
 * 最新の更新履歴を指定された要素に追加
 * @param {Document} doc - パース済みのHTMLドキュメント
 */
function renderLatestHistory(doc) {
	const targetElement = document.querySelector(LATEST_HISTORY_SELECTOR);
	if (!targetElement) {
		return;
	};

	const historyHeaders = doc.querySelectorAll(HISTORY_HEADER_TAG);
	const displayCount   = Math.min(historyHeaders.length, LATEST_HISTORY_COUNT);
	const fragment       = new DocumentFragment();

	for (let i = 0; i < displayCount; i++) {
		const header  = historyHeaders[i];
		const content = header.nextElementSibling;

		if (header) {
			fragment.appendChild(header.cloneNode(true));
		}
		if (content) {
			fragment.appendChild(content.cloneNode(true));
		}
	}

	targetElement.innerHTML = ""; // 既存コンテンツを消去
	targetElement.appendChild(fragment);
}

/**
 * 全ての更新履歴を指定された要素に追加
 * @param {string} html - 表示するHTML文字列
 */
function renderPastHistory(html) {
	const targetElement = document.querySelector(PAST_HISTORY_SELECTOR);

	if (!targetElement) {
		return;
	}

	targetElement.innerHTML = html;
}