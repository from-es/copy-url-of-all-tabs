// Import Types
import { type ExtensionMessage } from "@/assets/js/types/";

// Import from Script
import { logging }        from "@/assets/js/logging";
import { handleOpenURLs } from "./js/openUrlsHandler";

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