// WXT provided cross-browser Types.
import { type Browser } from "wxt/browser";

// Import Types
import type { Config, Define } from "@/assets/js/types/";
import type { Action }         from "./types";

// Import Module
import { toUniqueArray } from "@/assets/js/utils/toUniqueArray";



/**
 * コピーアクションのためにタブ情報を前処理
 * 設定に基づいてURLの重複排除とプロトコルフィルタリングを行う。
 * @param   {Browser.tabs.Tab[]} tabs   - 元のタブ配列
 * @param   {Action}             action - 実行するアクションの文字列（例: "copy"）
 * @param   {Config}             config - ユーザー設定オブジェクト
 * @param   {Define}             define - 定義済み定数オブジェクト
 * @returns {Browser.tabs.Tab[]}        - 設定適応済みタブオブジェクトの配列
 */
export function prepareForActionCopy(tabs: Browser.tabs.Tab[], action: Action, config: Config, define: Define): Browser.tabs.Tab[] {
	const urlList         = tabs.map(tab => tab.url).filter((url): url is string => !!url);
	const filteredUrlList = applyUrlProcessingRules(urlList, action, config, define);
	const filteredTabs    = rebuildTabsFromFilteredUrls(filteredUrlList, tabs);

	return filteredTabs;
}

/**
 * ペーストアクションのためにURLリストを前処理
 * クリップボードから取得したURLリストに対し、設定に基づいて、プロトコルフィルタリング、重複排除を行う。
 * @param   {string[]} urlList - 開く対象のURLリスト
 * @param   {Action}   action  - 実行するアクションの文字列（例: "paste"）
 * @param   {Config}   config  - ユーザー設定オブジェクト
 * @param   {Define}   define  - 定義済み定数オブジェクト
 * @returns {string[]}         - 設定適応済みURLリスト
 */
export function prepareForActionPaste(urlList: string[], action: Action, config: Config, define: Define): string[] {
	const filteredUrlList = applyUrlProcessingRules(urlList, action, config, define);

	return filteredUrlList;
}

/**
 * 設定に基づき、プロトコルフィルタリング、重複排除を行う。
 * @param   {string[]} urlList - 処理対象のURLリスト
 * @param   {Action}   action  - 実行するアクションの文字列（例: "copy" or "paste"）
 * @param   {Config}   config  - ユーザー設定オブジェクト
 * @param   {Define}   define  - 定義済み定数オブジェクト
 * @returns {string[]}         - 設定適応済みURLリスト
 */
function applyUrlProcessingRules(urlList: string[], action: Action, config: Config, define: Define): string[] {
	const isProtocolFilteringEnabled = (action === "copy") ? config.Filtering.Protocol.Copy.enable    : config.Filtering.Protocol.Paste.enable;
	const isDeduplicate              = (action === "copy") ? config.Filtering.Deduplicate.Copy.enable : config.Filtering.Deduplicate.Paste.enable;

	// Filtering: Protocol
	let filteredUrlList = filterUrlsByProtocol(urlList, isProtocolFilteringEnabled, action, config, define);

	// Filtering: deduplicate
	if (isDeduplicate) {
		const originalCount = filteredUrlList.length;
		filteredUrlList = toUniqueArray(filteredUrlList);

		if (originalCount > filteredUrlList.length) {
			console.log(`Deduplicated URLs on ${action}: ${originalCount} -> ${filteredUrlList.length}`);
		}
	}

	return filteredUrlList;
}

/**
 * URLリストをプロトコルに基づいてフィルタリング
 * @param   {string[]} urlList   - フィルタリング対象のURLリスト
 * @param   {boolean}  filtering - フィルタリングを有効にするか
 * @param   {Action}   action    - フィルタリングを実行するアクションの文字列（例: "copy" or "paste"）
 * @param   {Config}   config    - ユーザー設定オブジェクト
 * @param   {Define}   define    - 定義済み定数オブジェクト
 * @returns {string[]}           - フィルタリング済みURLリストの配列
 */
function filterUrlsByProtocol(urlList: string[], filtering: boolean, action: Action, config: Config, define: Define): string[] {
	const getRegexForProtocol = (config: Config, define: Define): RegExp => {
		const protocol      = config.Filtering.Protocol.type;
		const allowProtocol = [];

		for (const key in protocol) {
			if ( protocol[key] ) {
				allowProtocol.push(key);
			}
		}
		// Chrome 系ブラウザ対応の追加処理@2024/10/15
		if ( config.Filtering.Protocol.type.chrome ) {
			(define.ChromiumBasedBrowser).forEach(
				(brows) => {
					allowProtocol.push(brows);
				}
			);
		}
		// debug
		console.log("Debug, Allow Protocol >>", allowProtocol);

		if ( allowProtocol.length ) {
			const str = allowProtocol.join("|");
			const reg = `(${str}):`;

			return (new RegExp(reg, "i"));
		}

		// 何にも一致しない正規表現
		return /(?!)/;
	};
	const filteringURL = (url: string) => {
		url = (url).trim();

		// Filtering: is URL ?
		const isURL = URL.canParse(url);
		if ( !isURL ) {
			// debug
			console.log("Debug, Filtering : protocol. Cannot parse URL String >>", url);

			return false;
		}

		// Filtering: Filtering by protocol ?
		if ( !filtering ) {
			return true;
		}

		// Filtering: protocol
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
	const getArrayDiff = (original: string[], target: string[]): string[] => {
		const diff: string[] = [];

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

	const regex    = getRegexForProtocol(config, define);
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

/**
 * フィルタリング済みのURLリストと元のタブ配列を元に、順序を維持したタブの配列を効率的に再構築
 * @param   {string[]}           urls         - フィルタリング済みのURLリスト
 * @param   {Browser.tabs.Tab[]} originalTabs - 元のタブの完全なリスト
 * @returns {Browser.tabs.Tab[]}              - 再構築されたタブの配列
 */
function rebuildTabsFromFilteredUrls(urls: string[], originalTabs: Browser.tabs.Tab[]): Browser.tabs.Tab[] {
	// ループ数削減の為、URLをキー、タブを値とする Map オブジェクトを作成し、O(1) でのアクセスを可能にする
	const urlToTabMap = new Map<string, Browser.tabs.Tab>();

	for (const tab of originalTabs) {
		if (tab.url) {
			urlToTabMap.set(tab.url, tab);
		}
	}

	// フィルタリング済み、かつ順序が維持されたURLリストを元に、タブ配列を再構築
	const resultTabs = urls.map(url => urlToTabMap.get(url)).filter((tab): tab is Browser.tabs.Tab => tab !== undefined);

	return resultTabs;
};