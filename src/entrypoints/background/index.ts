// WXT provided cross-browser compatible API and types.
import { browser, type Browser } from "wxt/browser";

// Import Types
import { type ExtensionMessage } from "@/assets/js/types/";

// Import from Script
import { define }         from "@/assets/js/define";  // メッセージング経由で define を受け取る場合、構造化複製不可能な型が含まれていると送信エラーが発生する為、事前にインポートする@2025/09/13
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
	browser.runtime.onMessage.addListener(eventOnMessage);
}

/**
 * `browser.runtime.onMessage` に登録されたイベントハンドラ。
 * Promise を返すことで、非同期に応答を処理します。
 * @param   {object}                        message - ポップアップなどから受信したメッセージ
 * @param   {Browser.Runtime.MessageSender} sender  - メッセージの送信者情報
 * @returns {Promise<void | object>}                - 応答内容、または応答がないことを示す Promise
 */
async function eventOnMessage(message: ExtensionMessage, sender: Browser.runtime.MessageSender): Promise<void | object> {
	const { config } = message.status;

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
 * @param   {ExtensionMessage}              message
 * @param   {Browser.Runtime.MessageSender} sender
 * @returns {Promise<object>}
*/
async function handleDoNotMatchAnySwitchStatement(message: ExtensionMessage, sender: Browser.runtime.MessageSender): Promise<object> {
	const warningMessage = "Warning, Received a message with No Option";
	console.warn(warningMessage, { message, sender });

	return {
		message  : warningMessage,
		arguments: { message, sender }
	};
}