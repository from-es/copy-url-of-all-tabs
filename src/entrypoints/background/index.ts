// WXT provided cross-browser compatible API and types.
import { browser, type Browser } from "wxt/browser";

// Import Types
import { type ExtensionMessage } from "@/assets/js/types/";

// Import Module
import { define }           from "@/assets/js/define";  // メッセージング経由で define を受け取る場合、構造化複製不可能な型が含まれていると送信エラーが発生する為、事前にインポートする
import { logging }          from "@/assets/js/logging";
import { initializeConfig } from "@/assets/js/initializeConfig";
import { handleOpenURLs }   from "./js/openUrlsHandler";
import { countManager }     from "./js/CountManager";
import { badgeController }  from "./js/BadgeController";

export default defineBackground({
	// Set manifest options
	persistent: false,
	type      : "module",

	// Executed when background is loaded
	main
});


function main() {
	initialize();
}

async function initialize(): Promise<void> {
	browser.runtime.onMessage.addListener(eventOnMessage);

	await initializeLocalStorage();

	initializeBadgeCounter();
}

/**
 * 拡張機能起動時にローカルストレージを初期化する。
 * ストレージが空の場合、デフォルト設定が保存される。既に設定が保存されている場合は、何も行われない。
 */
async function initializeLocalStorage(): Promise<void> {
	try {
		await initializeConfig(null, true);

		console.info("[Initialize LocalStorage] Configuration successfully initialized on startup.");
	} catch (error) {
		console.error("[Initialize LocalStorage] Error during initial configuration on startup:", error);
	}
}

/**
 * バッジカウンター機能間の連携設定
 */
function initializeBadgeCounter() {
	console.log("Initialize, Badge Counter setting.");

	// カウント数の変更を監視し、バッジのテキストを更新
	countManager.subscribe((newCount) => {
		badgeController.updateText(String(newCount));
	});

	// ストレージの変更を監視し、バッジの色を更新
	browser.storage.onChanged.addListener(handleStorageOnChanged);
}

/**
 * `browser.storage.onChanged` イベントのリスナーとして、ストレージの変更を処理。
 * 特に、`local` ストレージエリアの `config` オブジェクトの変更を監視し、
 * バッジの色を更新するために `badgeController.updateColor` を呼び出す。
 * @param   {object} changes  - 変更されたストレージアイテムのオブジェクト。`key` はストレージアイテムの名前、値は `StorageChange` オブジェクト
 * @param   {string} areaName - 変更が発生したストレージエリアの名前（例: "local", "sync"）
 * @returns {void}
 */
async function handleStorageOnChanged(changes: { [key: string]: Browser.storage.StorageChange }, areaName: string): Promise<void> {
	try {
		if (areaName === "local" && changes.config) {
			// initializeConfig を経由して最新の設定を取得。`initializeConfig` を用いて値の検証と移行処理を行う
			// save: false を渡し、onChanged リスナー内で再度保存処理が走らないようにする
			const { config: updatedConfig } = await initializeConfig(changes.config.newValue, false);

			if (updatedConfig && updatedConfig.Badge) {
				badgeController.updateColor(updatedConfig.Badge);
			}
		}
	} catch (error) {
		console.error("Error in browser.storage.onChanged listener:", error);
	}
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