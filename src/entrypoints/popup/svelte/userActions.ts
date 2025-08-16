// Import Types
import { type Config, type Define } from "@/assets/js/types/";

// Import from Script
import { ClipboardManager } from "@/assets/js/lib/user/ClipboardManager.mjs";
import { FormatManager }    from "../js/FormatManager.mjs";



/**
 * 全タブのURLを取得し任意フォーマット後、クリップボードに送る
 * @param   {string}          action
 * @param   {object}          config - status.config
 * @param   {object}          config - status.config
 * @returns {Promise<object>}
 */
export async function eventActionCopy(action: string, config: Config, define: Define) {
	const type     = config.Format.type;
	const template = config.Format.template;
	const sanitize = true;

	const mimetype = (config.Format.type === "custom") ? config.Format.mimetype : "text/plain";
	const tabs     = await getAllTabs();

	const getFilteredTabs = (tabs, action, config, define) => {
		const urlList      = (tabs).map((tab) => { return tab.url; });
		const filtering    = config.Filtering.Copy.enable;
		const allowUrlList = new Set(filteringList(urlList, filtering, action, config, define));
		const filtered     = (tabs).filter((tab) => allowUrlList.has(tab.url));  // 全タブから allowUrlList に登録済みの URL を持つタブだけを取得

		return filtered;
	};

	const filteredTabs = getFilteredTabs(tabs, action, config, define);
	const text         = FormatManager.format(filteredTabs, type, template, sanitize);
	const num          = filteredTabs?.length ? filteredTabs.length : false;
	const status       = await ClipboardManager.write(text, mimetype);

	const result = {
		action     : action,
		status     : status,
		message    : status ? (num ? `${num} URLs copied !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment   : status ? true : false,
		urlList    : [],
		clipboard  : {
			direction : "From Tabs to Clipboard",
			text      : text
		}
	};

	return result;
}

/**
 * 「クリップボードから取得したURLをタブで開く」の前処理
 * @param   {string} action
 * @param   {object} config - status.config
 * @param   {object} define - status.define
 * @returns {object}
 */
export async function eventActionPaste(action: string, config: Config, define: Define) {
	const regexSearch     = config.Search.regex;
	const regexUrlPattern = define.Regex.url.RFC3986WithAuth;

	const status    = await ClipboardManager.readText();
	const text      = status ? status : "";
	const array     = getUrlList(text, regexSearch, regexUrlPattern);
	const filtering = config.Filtering.Paste.enable;
	const urlList   = filteringList(array, filtering, action, config, define);
	const num       = (urlList && Array.isArray(urlList) && urlList?.length) ? urlList.length : null;

	const result = {
		action    : action,
		status    : status,
		message   : status ? ((num && typeof num === "number") ? `${num} URLs open !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment  : (status && num) ? true : false,
		urlList   : urlList,
		clipboard : {
			direction : "From Clipboard to Tabs",
			text      : text
		}
	};

	return result;
}



/**
 * 全てのタブ情報を取得する
 * @return {chrome.tabs.Tab[]}
 */
async function getAllTabs() {
	const queryInfo = { currentWindow : true };            // 取得対象をカレントウインドウのタブに限定
	const tabs      = await chrome.tabs.query(queryInfo);  // tabs.query() : https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query

	return tabs;
}

/**
 * 文字列からURLのリストを抽出する
 * @param   {string}  text            - クリップボードなどから取得したテキスト
 * @param   {boolean} regexSearch     - 正規表現でURLを検索するか
 * @param   {RegExp}  regexUrlPattern - 正規表現のURL抽出パターン
 * @returns {string[]}                - URLリストの配列
 */
function getUrlList(text: string, regexSearch: boolean, regexUrlPattern: RegExp) {
	const isValidUrlString = (str: string) => {
		if ( !str || typeof str !== "string") {
			return false;
		}

		const trimmedURL = str.trim();

		if ( !(typeof trimmedURL === "string" && trimmedURL.length) ) {
			return false;
		}

		return URL.canParse(trimmedURL);
	};

	const array = regexSearch ? (text).match(regexUrlPattern) : text.split("\n");

	if ( !array || !Array.isArray(array)) {
		return [];
	}

	// 空配列 or 非URL文字列の除去
	const result = (array).filter(
		(elm) => { return  isValidUrlString(elm); }
	);

	return result;
}

/**
 * URLリストをプロトコルに基づいてフィルタリングする
 * @param  {string[]} urlList   - フィルタリング対象のURLリスト
 * @param  {boolean}  filtering - フィルタリングを有効にするか >> config.Filtering.Paste.enable
 * @param  {string}   action    - フィルタリングを実行するアクションの文字列 >> "copy" or "paste"
 * @param  {object}   config    - status.config
 * @param  {object}   define    - status.define
* @returns {string[]}           - フィルタリング済みURLリストの配列
 */
function filteringList(urlList, filtering, action, config, define) {
	const getRegexProtocol = (config, define) => {
		const protocol = config.Filtering.Protocol;
		const array    = [];

		for (const key in protocol) {
			if ( protocol[key] ) {
				array.push(key);
			}
		}
		// Chrome 系ブラウザ対応の追加処理@2024/10/15
		if ( config.Filtering.Protocol.chrome ) {
			(define.ChromiumBasedBrowser).forEach(
				(browser) => {
					array.push(browser);
				}
			);
		}
		// debug
		console.log("Debug, Allow Protocol >>", array);

		if ( array.length ) {
			const str = array.join("|");
			const reg = `(${str}):`;

			return (new RegExp(reg, "i"));
		}

		return null;
	};
	const filteringURL = (url) => {
		url = (url).trim();

		// Filtering : is URL ?
		const isURL = URL.canParse(url);
		if ( !isURL ) {
			// debug
			console.log("Debug, Filtering : protocol. Cannot parse URL String >>", url);

			return false;
		}

		// Filtering : Filtering by protocol ?
		if ( !filtering ) {
			return true;
		}

		// Filtering : protocol
		const protocol = (new URL(url)).protocol;
		const isMatch  = (regex).test(protocol);
		if ( !isMatch ) {
			// debug
			console.log("Debug, Filtering : protocol >> Deny URL >>", url);

			return false;
		}

		// Passed all checks
		return true;
	};
	const getArrayDiff = (original, target) => {
		const diff = [];

		(original).forEach(
			(elm) => {
				const exist = (target).includes(elm);

				if (!exist) {
					diff.push(elm);
				}
			}
		);

		return diff;
	};

	const regex    = getRegexProtocol(config, define);
	const list     = structuredClone(urlList);
	const filtered = (list).filter(filteringURL);
	const result   = (filtered).map((url) => { return url.trim(); });
	const diff     = getArrayDiff(urlList, result); // 配列 urlList と result の差分取得 >> デバック用

	// debug
	console.log(`Debug, Action ${action}. Filtering >>`,
		{
			list: {
				before : urlList, // 全タブのURLの配列
				after  : result,  // フィルタリング済みURLの配列
				diff   : diff     // 配列差分 >> 全タブのURLとフィルタリング済みURLとの比較
			},
			action    : action,
			filtering : filtering,
			regex
		}
	);

	return result;
}