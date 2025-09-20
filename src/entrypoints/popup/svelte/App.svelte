<script lang="ts">
	// WXT provided cross-browser compatible API and types.
	import { browser, type Browser } from "wxt/browser";

	// Import Svelte
	import { onMount } from "svelte";

	// Import from Script
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

	function initialize() {
		// スタイル(popup.css >> :root要素)の動的書き換え
		const fontSize = status.config.PopupMenu.fontsize;
		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);

		// debug
		console.info("The Component, initialize");
		console.log("Debug, status >>", status);
	}



	async function eventOnClick(event: MouseEvent) {
		const self               = event.currentTarget;
		const { config, define } = await initializeConfig(null);                                    // 「ポップアップメニュー呼び出した状態でオプション変更 → 再度、ポップアップメニューから呼び出し」時の対策@2024/10/18
		const action             = self ? (self as HTMLElement).getAttribute("data-action") : null; // 実行するアクション >> "copy" or "paste" or "options"
		let   result             = null;

		// 状態管理を appState に委譲
		actionStore.startAction(action);

		try {
			result = await handleAction(action, config, define);
		} catch (error) {
			result = createErrorResult(action, error);

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
			openURLs(result.urlList, config.Tab, status);
		}

		// メッセージの表示
		showMessage(action, result, config);

		// ポップアップメニューを閉じる
		closePopupMenu(config.PopupMenu.OnClickClose);
	}

	async function eventOpenOptionsPage() {
		browser.runtime.openOptionsPage();

		const delay = 500; // milliseconds
		window.setTimeout(() => { window.close(); }, delay);
	}

	function eventDoNotMatch(action) {
		const message = `Error, Do not match any switch statement. >> eventOnClick() >> ${action}`;
		const result  = {
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
	 * @param   {string} action
	 * @param   {object} config
	 * @param   {object} define
	 * @returns {object}        - result
	 */
	async function handleAction(action, config, define) {
		let result = null;

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
	 * @param {string} action
	 * @param error
	 */
	function createErrorResult(action, error) {
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
	 * @param   {string[]} urlList
	 * @param   {object}   option
	 * @param   {object}   status
	 * @returns {void}
	 */
	function openURLs(urlList, option, status) {
		const message  = {
			action  : status.define.Messaging.OpenURLs,
			address : {
				from : "popup.js",
				to   : "background.js"
			},
			status : {
				config : status.config,
				define : status.define
			},
			argument : {
				urlList : urlList,
				option  : option
			}
		};

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
	 * メッセージの表示
	 * @param   {string} action
	 * @param   {object} result
	 * @param   {object} config
	 * @returns {void}
	 */
	function showMessage(action, result, config) {
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
	 * メッセージの生成
	 * @param   {string} action
	 * @param   {object} result
	 * @returns {string}
	 */
	function createMessage(action, result) {
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
	 * メッセージの消去
	 * @param   {string} message - HTML Text
	 * @param   {object} option  - config.PopupMenu.ClearMessage
	 * @returns {void}
	 */
	function clearMessage(message, option) {
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
	 * @param   {object} config
	 * @returns {void}
	 */
	function closePopupMenu(option) {
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



{#snippet button(attr)}
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