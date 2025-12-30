<script lang="ts">
	// WXT provided cross-browser compatible API and types.
	import { browser } from "wxt/browser";

	// Import Types
	import type { Config, Define, ExtensionMessage } from "@/assets/js/types/";
	import type { Action, EventOnClickActionResult } from "./types";

	// Import Svelte
	import { onMount } from "svelte";

	// Import Module
	import { appState, actionStore, isActionInProgress, shouldShowMessage } from "./appState";
	import { initializeConfig }                                             from "@/assets/js/initializeConfig";
	import { eventActionCopy, eventActionPaste }                            from "./userActions";
	import { sanitizeForSendMessage }                                       from "@/assets/js/utils/sanitizeForSendMessage";
	import { createSafeHTML }                                               from "@/assets/js/utils/setSafeHTML";

	const { status } = $props();

	onMount(() => {
		console.info("The Component status, On mount");

		initialize();
	});

	/**
	 * ポップアップメニューの初期化処理を行う。
	 */
	function initialize(): void {
		// スタイル(popup.css >> :root要素)の動的書き換え
		const fontSize = status.config.PopupMenu.fontsize;
		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);

		// debug
		console.info("The Component, initialize");
		console.log("Debug, status >>", status);
	}

	/**
	 * ボタンクリックイベントを処理するハンドラ。
	 * data-action属性に基づいて、対応するアクションを実行。
	 * @param {MouseEvent} event - マウスクリックイベントオブジェクト
	 */
	async function eventOnClick(event: MouseEvent): Promise<void> {
		const self               = event.currentTarget;
		const { config, define } = await initializeConfig(null);                                              // 「ポップアップメニュー呼び出した状態でオプション変更 → 再度、ポップアップメニューから呼び出し」時の対策@2024/10/18
		const action             = self ? (self as HTMLElement).getAttribute("data-action") as Action : null; // 実行するアクション >> "copy" or "paste" or "options"
		let   result: EventOnClickActionResult | null = null;

		// 状態管理を appState に委譲
		actionStore.startAction(action);

		try {
			result = await handleAction(action, config, define);
		} catch (error) {
			result = createErrorResult(action, error as Error);

			// debug
			console.error("Error, Action execution failed. { action, error } >>", { action, error });
		} finally {
			// アクション完了を通知
			actionStore.completeAction(result);

			// debug
			console.log("Debug, { action, result } >>", { action, result });
		}

		// "paste" アクションの後処理
		if ( action === "paste" && result && result.judgment && result.urlList?.length > 0 ) {
			const urlList          = result.urlList;
			const extensionMessage = {
				action : status.define.Messaging.OpenURLs,
				address: {
					from: "popup.js",
					to  : "background.js"
				},
				status: {
					config: status.config,
					define: status.define
				},
				argument: {
					urlList: urlList,
					option : config
				}
			};

			openURLs(extensionMessage);
		}

		// メッセージの表示
		showMessage(action, result, config);

		// ポップアップメニューを閉じる
		closePopupMenu(config.PopupMenu.OnClickClose);
	}

	/**
	 * 拡張機能のオプションページを開く。
	 * ページを開いた後、少し遅れてポップアップメニューを閉じる。
	 */
	async function eventOpenOptionsPage(): Promise<void> {
		browser.runtime.openOptionsPage();

		const delay = 500; // milliseconds
		window.setTimeout(() => { window.close(); }, delay);
	}

	/**
	 * いずれのアクションにも一致しない場合のフォールバック処理。
	 * エラーメッセージを含む結果オブジェクトを生成。
	 * @param   {Action | null}            action - 実行されなかったアクション
	 * @returns {EventOnClickActionResult}        - エラー情報を含む結果オブジェクト
	 */
	function eventDoNotMatch(action: Action | null): EventOnClickActionResult {
		const message = `Error, Do not match any switch statement. >> eventOnClick() >> ${action}`;
		const result: EventOnClickActionResult  = {
			action,
			status   : false,
			message  : message,
			judgment : false,
			urlList  : [],
			clipboard: { direction: null, text: null }
		};

		// debug
		console.error(message);

		return result;
	}

	/**
	 * 渡されたアクションに応じて、対応するイベント処理関数を呼び出す。
	 * @param   {Action | null}                            action - 実行するアクション
	 * @param   {Config}                                   config - 拡張機能の設定オブジェクト
	 * @param   {Define}                                   define - 拡張機能の定義オブジェクト
	 * @returns {Promise<EventOnClickActionResult | null>}        - アクションの実行結果。'options'アクションの場合は null を返す
	 */
	async function handleAction(action: Action | null, config: Config, define: Define): Promise<EventOnClickActionResult | null> {
		let result: EventOnClickActionResult | null = null;

		switch (action) {
			case "copy":
				result = await eventActionCopy(action, config, define);
				break;
			case "paste":
				result = await eventActionPaste(action, config, define);
				break;
			case "options":
				eventOpenOptionsPage();
				break;
			default:
				result = eventDoNotMatch(action);
		}

		return result;
	}

	/**
	 * アクション実行中にエラーが発生した場合に、エラー結果オブジェクトを生成。
	 * @param   {Action | null}            action - エラーが発生したアクション
	 * @param   {Error}                    error  - 発生したエラーオブジェクト
	 * @returns {EventOnClickActionResult}        - エラー情報を含む結果オブジェクト
	 */
	function createErrorResult(action: Action | null, error: Error): EventOnClickActionResult {
		let message = "An error occurred during the operation.";

		if (error instanceof Error && error?.message) {
			message += ` ${error.message}`;
		}

		return {
			action,
			status   : false,
			message  : message,
			judgment : false,
			urlList  : [],
			clipboard: { direction: null, text: null }
		};
	}

	/**
	 * 指定されたURLリストを新しいタブで開くよう、バックグラウンドスクリプトにメッセージを送信。
	 * @param {ExtensionMessage} message - 開くURLリストと設定を含むメッセージオブジェクト
	 */
	function openURLs(message: ExtensionMessage): void {
		// Firefoxとの互換性と安全性のために、送信前にオブジェクトをサニタイズ >> 構造化複製アルゴリズム不可なプロパティを除去
		const options = {
			checkOnly: false,
			debug    : false
		};
		const sanitizedMessage = sanitizeForSendMessage(message, options);

		// アクティブなタブで開くとフォーカスが移動してポップアップメニューが閉じ、処理途中でも終了する為、background.js 側でタブを開く@2024/10/13
		browser.runtime.sendMessage(sanitizedMessage);
	}

	/**
	 * アクションの結果に基づいたメッセージをUIに表示。
	 * @param {Action | null}                   action - 実行されたアクション
	 * @param {EventOnClickActionResult | null} result - アクションの結果オブジェクト
	 * @param {Config}                          config - 拡張機能の設定オブジェクト
	 */
	function showMessage(action: Action | null, result: EventOnClickActionResult | null, config: Config): void {
		const message = createMessage(action, result);
		const option  = config.PopupMenu.ClearMessage;

		if ( !message ) {
			return;
		}

		actionStore.setMessage(message);

		if ( !$shouldShowMessage ) {
			return;
		}

		clearMessage(message, option);
	}

	/**
	 * アクション結果から、UIに表示するためのHTMLメッセージ文字列を生成。
	 * @param   {Action | null}                   action - 実行されたアクション
	 * @param   {EventOnClickActionResult | null} result - アクションの結果オブジェクト
	 * @returns {string | null}                          - 生成されたHTML文字列。結果がない場合は null を返す
	 */
	function createMessage(action: Action | null, result: EventOnClickActionResult | null): string | null {
		if ( !result || !result?.message ) {
			// debug
			console.log('Debug, "result or result.message" is "null or undefined or empty"! >>', { action, result });

			return null;
		}

		const { judgment, message } = result;

		const attr     = judgment ? "success" : "error";
		const preamble = judgment ? `success` : `error`;
		const body     = message;
		const html     = message ? `<p class="${attr}"><span>${preamble}</span>, <span>${action}</span> action.</p><p class="${attr}">${body}</p>` : null;

		return html;
	}

	/**
	 * 表示されているメッセージを、設定されたタイムアウト後に消去。
	 * @param {string}                              message - 表示されているメッセージ文字列
	 * @param {Config["PopupMenu"]["ClearMessage"]} option  - メッセージクリアに関する設定
	 */
	function clearMessage(message: string, option: Config["PopupMenu"]["ClearMessage"]): void {
		if ( !message || !(typeof message === "string") || !(message.length > 0) ) {
			// debug
			console.error("Error, Invalid argument passed to showMessage(message, option) >> message >>", message);

			return;
		}
		if ( !option ) {
			// debug
			console.error("Error, Invalid argument passed to showMessage(message, option) >> option >>", { option });

			return;
		}
		if ( !(Object.hasOwn(option, "enable") && typeof option?.enable === "boolean") ) {
			// debug
			console.error("Error, Invalid argument passed to showMessage(message, option) >> option >>", { enable: option?.enable });

			return;
		}
		if ( !(Object.hasOwn(option, "timeout") && typeof option.timeout === "number" && option.timeout >= 0) ) {
			// debug
			console.error("Error, Invalid argument passed to showMessage(message, option) >> option >>", { timeout: option?.timeout });

			return;
		}

		const { enable: clear, timeout: delay } = option;

		if ( clear ) {
			window.setTimeout(() => { actionStore.setMessage(""); }, delay * 1000);
		}
	}

	/**
	 * ポップアップメニューを、設定されたタイムアウト後に閉じる。
	 * @param {Config["PopupMenu"]["OnClickClose"]} option - ポップアップメニューを閉じる動作に関する設定
	 */
	function closePopupMenu(option: Config["PopupMenu"]["OnClickClose"]): void {
		const { enable: close, timeout: delay } = option;

		if ( !(typeof close === "boolean") || !(typeof delay === "number" && delay >= 0) ) {
			// debug
			console.error("Error, Invalid argument passed to closePopupMenu(option) >>", option);

			return;
		}

		if ( close ) {
			window.setTimeout(() => { window.close(); }, delay * 1000);

			// debug
			console.log("Debug, Close Popup Menu >>", { close, delay });
		}
	}
</script>



{#snippet button(attr: { action: Action; label: string; text: string; disabled: boolean })}
	<button
		class       = "text"
		type        = "button"
		aria-label  = { attr.label }
		data-action = { attr.action }
		disabled    = { attr.disabled }
		onclick     = { eventOnClick }
	>
		{ attr.text }
	</button>
{/snippet}



<main>
	<section id="action">
		<ul>
			<li id="copy" class="menu">
				{@render button(
					{
						action  : "copy",
						label   : "Copy URLs of all tabs to clipboard",
						text    : ($isActionInProgress && $appState.currentAction === "copy") ? "Copying..." : "Copy",
						disabled: $isActionInProgress
					}
				)}
			</li>
			<li id="paste" class="menu">
				{@render button(
					{
						action  : "paste",
						label   : "Open URLs from clipboard in new tabs",
						text    : ($isActionInProgress && $appState.currentAction === "paste") ? "Pasting..." : "Paste",
						disabled: $isActionInProgress
					}
				)}
			</li>
		</ul>
	</section>

	<section id="toolbar" class="separator">
		<ul>
			<li id="option" class="menu">
				{@render button(
					{
						action  : "options",
						label   : "Open extension options page",
						text    : "Options",
						disabled: $isActionInProgress
					}
				)}
			</li>
		</ul>
	</section>

	<section id="message" aria-live="polite">
		{#if $shouldShowMessage}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html createSafeHTML($appState.message)}
		{/if}
	</section>
</main>



<style>
</style>