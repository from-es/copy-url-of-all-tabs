// WXT provided cross-browser compatible API and types.
import { browser, type Browser } from "wxt/browser";

// Import Types
import type { Config, Define }                                        from "@/assets/js/types/";
import type { Action, EventActionCopyResult, EventActionPasteResult } from "./types";

// Import Module
import { ClipboardManager }                            from "@/assets/js/lib/user/ClipboardManager";
import { FormatManager }                               from "../js/FormatManager";
import { prepareForActionCopy, prepareForActionPaste } from "./filtering";



/**
 * 全タブのURLを取得し、設定に基づいてフィルタリングとフォーマットを行った後、クリップボードに送ります。
 * @param   {Action}                         action - 実行するアクションの文字列（例: "copy"）
 * @param   {Config}                         config - ユーザー設定オブジェクト
 * @param   {Define}                         define - 定義済み定数オブジェクト
 * @returns {Promise<EventActionCopyResult>}        - コピー結果とステータスを含むオブジェクト
 */
export async function eventActionCopy(action: Action, config: Config, define: Define): Promise<EventActionCopyResult> {
	const rawTabs  = await getAllTabs();
	const tabs     = prepareForActionCopy(rawTabs, action, config, define);
	const type     = config.Format.type;
	const template = config.Format.template;
	const sanitize = true;
	const mimetype = (config.Format.type === "custom" && config.Format?.mimetype) ? config.Format.mimetype : "text/plain";

	// Format and write to clipboard
	const text   = FormatManager.format(tabs, type, template, sanitize);
	const status = await ClipboardManager.write(text, mimetype);

	const num    = tabs.length;
	const result = {
		action   : action,
		status   : status,
		message  : status ? (num ? `${num} URLs copied !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment : status ? true : false,
		urlList  : [],
		clipboard: {
			direction: "From Tabs to Clipboard",
			text     : text
		}
	};

	return result;
}

/**
 * クリップボードからURLを抽出し、設定に基づいてフィルタリングを行う前処理です。
 * @param   {Action}                         action - 実行するアクションの文字列（例: "paste"）
 * @param   {Config}                         config - ユーザー設定オブジェクト
 * @param   {Define}                         define - 定義済み定数オブジェクト
 * @returns {Promise<EventActionPasteResult>}       - ペースト結果とステータスを含むオブジェクト
 */
export async function eventActionPaste(action: Action, config: Config, define: Define): Promise<EventActionPasteResult> {
	const regexSearch     = config.Search.regex;
	const regexUrlPattern = define.Regex.url.RFC3986LooseWithAuth;

	const status  = await ClipboardManager.readText();
	const text    = status ? status : "";
	const rawList = getUrlList(text, regexSearch, regexUrlPattern);
	const urlList = prepareForActionPaste(rawList, action, config, define);
	const num     = (urlList && Array.isArray(urlList) && urlList?.length) ? urlList.length : null;

	const result = {
		action   : action,
		status   : status,
		message  : status ? ((num && typeof num === "number") ? `${num} URLs open !` : "Not found URLs.") : "Could not access to clipboard.",
		judgment : (status && num) ? true : false,
		urlList  : urlList,
		clipboard: {
			direction: "From Clipboard to Tabs",
			text     : text
		}
	};

	return result;
}

/**
 * 全てのタブ情報を取得
 * @return {Promise<Browser.tabs.Tab[]>}
 */
async function getAllTabs(): Promise<Browser.tabs.Tab[]> {
	try {
		const queryInfo = { currentWindow : true };            // 取得対象をカレントウインドウのタブに限定
		const tabs      = await browser.tabs.query(queryInfo); // tabs.query() : https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query

		return tabs;
	} catch (error) {
		console.error("Error, Failed to get tabs >> getAllTabs() >>", { error });

		return [];
	}
}

/**
 * 文字列からURLのリストを取得
 * @param   {string}  text            - クリップボードなどから取得したテキスト
 * @param   {boolean} regexSearch     - 正規表現でURLを検索するか
 * @param   {RegExp}  regexUrlPattern - 正規表現のURL抽出パターン
 * @returns {string[]}                - URLリストの配列
 */
function getUrlList(text: string, regexSearch: boolean, regexUrlPattern: RegExp): string[] {
	const isValidUrlString = (str: string) => {
		if ( !str || typeof str !== "string" ) {
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