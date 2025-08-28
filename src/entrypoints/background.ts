// Import Types
import { type Define, type ExtensionMessage }                from "@/assets/js/types/";
import { type UrlDelayRule, type UrlDelayCalculationResult } from "@/assets/js/lib/user/UrlDelayCalculator";

// Import from Script
import { logging }            from "@/assets/js/function.mjs";
import { UrlDelayCalculator } from "@/assets/js/lib/user/UrlDelayCalculator";

// Types defined only in "background.ts"
type TabPosition      = "default" | "first" | "left" | "right" | "last";
type CreateTabOptions = Define["Config"]["Tab"] & { windowId: number | undefined };

export default defineBackground({
	// Set manifest options
	persistent: false,
	type      : "module",

	// Executed when background is loaded
	main
});

function main() {
	chrome.runtime.onMessage.addListener(eventOnMessage);
}



/**
 * `chrome.runtime.onMessage` に登録されたイベントハンドラ。
 * Promise を返すことで、非同期に応答を処理します。
 * @param   {object}                       message - ポップアップなどから受信したメッセージ
 * @param   {chrome.runtime.MessageSender} sender  - メッセージの送信者情報
 * @returns {Promise<void | object>}               - 応答内容、または応答がないことを示す Promise
 */
async function eventOnMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<void | object> {
	const { config, define } = message.status;

	// Set logging console
	logging(config, define);

	// debug
	console.log("background.js received message >>", { message, sender });

	switch (message.action) {
		case define.Messaging.OpenURLs:
			return handleOpenURLs(message);
		default:
			return handleDoNotMatchAnySwitchStatement(message, sender);
	}
}

/**
 * @param   {ExtensionMessage} message
 * @returns {Promise<void>}
 */
async function handleOpenURLs(message: ExtensionMessage): Promise<void> {
	const { argument } = message;
	const urlList      = argument?.urlList;
	const option       = argument?.option;

	if (urlList && option) {
		openURLs(urlList, option);
	} else {
		console.error("Error: Cannot open URL List! urlList or option are missing in the message argument.", { argument });
	}
}

/**
 * @param   {ExtensionMessage}             message
 * @param   {chrome.runtime.MessageSender} sender
 * @returns {Promise<object>}
*/
async function handleDoNotMatchAnySwitchStatement(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<object> {
	const warningMessage = "Warning, Received a message with No Option";
	console.warn(warningMessage, { message, sender });

	return {
		message  : warningMessage,
		arguments: { message, sender }
	};
}



/**
 * @param   {string[]}      urlList
 * @param   {object}        option
 * @returns {Promise<void>}
 */
async function openURLs(urlList: string[], option: Define["Config"]["Tab"]): Promise<void> {
	const { reverse, delay, customDelay } = option;
	const windowId                        = await getCurrentWindowID();

	// debug
	console.log("Debug, Open URLs >> config >>", { urlList, ...option });

	if ( !urlList || !Array.isArray(urlList) ) {
		return;
	}

	// 逆順に開く？
	const list = reverse ? urlList.toReversed() : urlList;

	const getDelayList = (urls: string[], defaultDelay: number, customDelayConfig: Define["Config"]["Tab"]["customDelay"]): UrlDelayCalculationResult[] => {
		const { enable, list }      = customDelayConfig;
		const applyFrom             = 2;  // 遅延適応はルールマッチ二回目から
		let   rules: UrlDelayRule[] = [];

		if ( enable && list ) {
			rules = list.map(
				(rule) => {
					return {
						pattern  : rule.pattern,
						delay    : rule.delay,
						matchType: "prefix"
					};
				}
			);
		}

		return UrlDelayCalculator.calculate(urls, defaultDelay, rules, applyFrom);
	};

	// getRebuildUrlList 経由でカスタム遅延リストを取得
	const rebuildUrlList = getDelayList(list, delay, customDelay);

	// debug
	console.log(
		"Debug, Open URLs >> option & URL List >>",
		{
			option    : { reverse, delay, customDelay },
			"URL List": {
				source : list,
				rebuild: rebuildUrlList
			}
		}
	);

	(rebuildUrlList).forEach((obj) => {
		setTimeout(() => { createTab(obj.url, { ...option, windowId }); }, obj.delay.cumulative);
	});
}

/**
 * @returns {Promise<number | undefined>}
 */
async function getCurrentWindowID(): Promise<number | undefined> {
	const window   = await chrome.windows.getCurrent({ windowTypes: [ "normal" ] });
	const windowId = window.id;

	return windowId;
}

/**
 * @param   {string} url
 * @param   {CreateTabOptions} option
 * @returns {void}
 */
async function createTab(url: string, option: CreateTabOptions) {
	const { active, position, windowId } = option;

	const tabs       = await chrome.tabs.query({ currentWindow : true });
	const currentTab = (tabs).find((tab) => tab.active === true);
	const tabIndex   = createTabPosition(position, tabs, currentTab);

	const property         = { url, active, windowId };
	const createProperties = (typeof tabIndex === "number") ? Object.assign(property, { index : tabIndex }) : property;

	// debug
	console.log("Debug, Open URLs >> tab >>", { position : position, ...createProperties });

	chrome.tabs.create(createProperties);
}

/**
 * @param   {TabPosition}               position
 * @param   {chrome.tabs.Tab[]}         tabs
 * @param   {chrome.tabs.Tab|undefined} currentTab
 * @returns {number | null}
 */
function createTabPosition(position: TabPosition, tabs: chrome.tabs.Tab[], currentTab: chrome.tabs.Tab | undefined): number | null {
	let number: number | null = null;

	switch (position) {
		case "default":
			number = null;
			break;
		case "first":
			number = 0;
			break;
		case "left":
			number = currentTab ? currentTab.index : null;
			break;
		case "right":
			number = currentTab ? currentTab.index + 1 : null;
			break;
		case "last":
			number = tabs.length + 1;
			break;
		default:
			/*
			  position が "未指定 or undefined or null" の場合のタブの位置は、chrome.tabs.create(options) における index のデフォルトの挙動に準ずる
			  index のデフォルトの挙動: 新規タブは、指定されたウィンドウの一番右端（末尾）に作成される
			*/

			// debug
			console.error("Error, Invalid argument passed to createTabPosition(position, tabs, currentTab) >> position >>", position);
			break;
	}

	if ( (typeof number === "number") && number < 0 ) {
		number = 0;
	}

	return number;
}