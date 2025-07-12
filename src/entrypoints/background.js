// Import from Script
import { logging } from "@/assets/js/function.mjs";

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
function eventOnMessage(message, sender, sendResponse) {
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
async function handleOpenURLs(message) {
	const { urlList, option } = message.argument;

	openURLs(urlList, option);
}

/**
 * @param   {object}                       message
 * @param   {chrome.runtime.MessageSender} sender
 * @param   {Function}                     sendResponse
 * @returns {void}
*/
async function handleDoNotMatchAnySwitchStatement(message, sender, sendResponse) {
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
 * @param   {string[]} urlList
 * @param   {object}   option
 * @returns {void}
 */
async function openURLs(urlList, option) {
	const { reverse, delay } = option;
	const windowId           = await getCurrentWindowID();

	// debug
	console.log("Debug, Open URLs >> config >>", { urlList, ...option });

	if ( !urlList || !Array.isArray(urlList) ) {
		return;
	}

	// 逆順に開く？
	const list = reverse ? urlList.toReversed() : urlList;

	(list).forEach(
		(url, index) => {
			console.log("Debug, Open URLs >> url >>", { LoopIndex : index, delay : index * delay, url });

			setTimeout(() => { createTab(url, { ...option, windowId }); }, index * delay);
		}
	);
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
async function createTab(url, option) {
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
function createTabPosition(position, tabs, currentTab) {
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