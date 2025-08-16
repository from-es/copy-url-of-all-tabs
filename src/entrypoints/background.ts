// Import Types
import { type Define }                                       from "@/assets/js/types/";
import { type UrlDelayRule, type UrlDelayCalculationResult } from "@/assets/js/lib/user/UrlDelayCalculator";

// Import from Script
import { logging }            from "@/assets/js/function.mjs";
import { UrlDelayCalculator } from "@/assets/js/lib/user/UrlDelayCalculator";

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
 * @param   {object}                       message
 * @param   {chrome.runtime.MessageSender} sender
 * @param   {Function}                     sendResponse
 * @returns {Promise}
 */
function eventOnMessage(message: { status: { config: any; define: any; }; action: any; }, sender: any, sendResponse: any) {
	const { config, define } = message.status;

	// Set logging console
	logging(config, define);

	// debug
	console.log("background.js received message >>", { message, sender, sendResponse });

	switch (message.action) {
		case define.Messaging.OpenURLs:
			handleOpenURLs(message);
			break;
		default:
			handleDoNotMatchAnySwitchStatement(message, sender, sendResponse);
			break;
	}

	// 非同期の場合は一旦 true を返す。その後、 sendResponse() を使用し「chrome.runtime.onMessage.addListener() の呼び出し先」に値を返す
	return true;
}

/**
 * @param   {object} message
 * @returns {void}
 */
async function handleOpenURLs(message: { argument: { urlList: any; option: any; }; }) {
	const { urlList, option } = message.argument;

	openURLs(urlList, option);
}

/**
 * @param   {object}                       message
 * @param   {chrome.runtime.MessageSender} sender
 * @param   {Function}                     sendResponse
 * @returns {void}
*/
async function handleDoNotMatchAnySwitchStatement(message: any, sender: any, sendResponse: (arg0: { message: string; arguments: { message: any; sender: any; sendResponse: any; }; }) => void) {
	console.warn("Warning, Received a message with No Option >> ", { message, sender, sendResponse });

	const msg = {
		message  : "Warning, Received a message with No Option",
		arguments: { message, sender, sendResponse }
	};

	if ( sendResponse ) {
	  sendResponse(msg);
	}
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
 * @returns {number}
 */
async function getCurrentWindowID() {
	const window   = await chrome.windows.getCurrent({ windowTypes: [ "normal" ] });
	const windowId = window.id;

	return windowId;
}

/**
 * @param   {string} url
 * @param   {object} option - { active, position }
 * @returns {void}
 */
async function createTab(url: string, option: { windowId: any; reverse?: boolean; active: any; delay?: number; customDelay?: { enable: boolean; list: { id: string; pattern: string; delay: number; }[]; }; position: any; }) {
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
 * @param   {string}            position
 * @param   {chrome.tabs.Tab[]} tabs
 * @param   {chrome.tabs.Tab}   currentTab
 * @returns {number}
 */
function createTabPosition(position: string, tabs: chrome.tabs.Tab[], currentTab: chrome.tabs.Tab): number {
	let number = null;

	switch (position) {
		case "default":
			number = null;
			break;
		case "first":
			number = 0;
			break;
		case "left":
			number = currentTab.index;
			break;
		case "right":
			number = currentTab.index + 1;
			break;
		case "last":
			number = tabs.length + 1;
			break;
		default:
			// debug
			console.error("Error, Invalid argument passed to createTabPosition(position, tabs, currentTab) >> position >>", position);

			break;
	}

	if ( (typeof number === "number") && number < 0 ) {
		number = 0;
	}

	return number;
}