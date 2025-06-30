<script>
	// Import Svelte
	import { onMount } from "svelte";

	// Import from Script
	import { appState, actionStore, isActionInProgress, shouldShowMessage } from "./appState.js";
	import { initializeConfig }                                             from "@/assets/js/initializeConfig.mjs";
	import { ClipboardManager }                                             from "@/assets/js/lib/user/ClipboardManager.mjs";
	import { FormatManager }                                                from "../js/FormatManager.mjs";

	const { status } = $props();

	onMount(() => {
		console.info("The Component status, On mount");

		initialize();
	});

	function initialize() {
		// スタイル(popup.css >> :root要素)の動的書き換え
		const fontSize = status.config.PopupMenu.fontsize;
		document.documentElement.style.setProperty("--base-font-size", `${fontSize}px`);

		// Debug
		console.info("The Component, initialize");
		console.log("Debug, status >>", status);
	}



	async function eventOnClick() {
		const config = await initializeConfig(status.define);  // 「ポップアップメニュー呼び出した状態でオプション変更 → 再度、ポップアップメニューから呼び出し」時の対策@2024/10/18
		const action = (this).getAttribute("data-action");     // 実行するアクション >> "copy" or "paste" or "options"

		// 状態管理を appState に委譲
		actionStore.startAction(action);

		let result = null;

		try {
			switch (action) {
				case "copy":
					result = await eventGetURLforAllTabs(action, config);
					break;
				case "paste":
					result = await eventSetURLforTab(action, config);
					break;
				case "options":
					await eventOpenOptionsPage();
					break;
				default:
					eventDoNotMatch(action);
					break;
			}

			// "paste" アクションの後処理
			if (action === "paste" && result.judgment && result.urlList?.length > 0) {
				openURLs(result.urlList, config.Tab, status);
			}
		} catch (error) {
			let message = "An error occurred during the operation.";
			if ( error instanceof Error && error?.message ) {
				message += ` ${error.message}`;
			}

			result = {
				action,
				status   : false,
				message  : message,
				judgment : false,
				urlList  : [],
				clipboard: { direction: null, text: null }
			};

			// debug
			console.error("Error, Action execution failed. { error } >>", { error });
		} finally {
			// アクション完了を通知
			actionStore.completeAction(result);

			// debug
			console.log("Debug, { action, result } >>", { action, result });
		}

		// メッセージ表示
		const message = createMessage(action, result);
		if ( message ) {
			actionStore.setMessage(message);

			handleMessageDisplay(config.PopupMenu.ClearMessage);
		}

		// ポップアップ制御
		closePopupMenu(config.PopupMenu.OnClickClose);
	}

	// メッセージ表示(Action, Copy or Paste)
	function handleMessageDisplay(option) {
		if ( !$shouldShowMessage ) {
			return;
		}

		showMessage($appState.message, option);
	}

	/**
	 * 全タブのURLを取得し任意フォーマット後、クリップボードに送る
	 * @param   {string} action
	 * @param   {object} config - status.config
	 * @returns {object}
	 */
	async function eventGetURLforAllTabs(action, config) {
		const type     = config.Format.type;
		const template = config.Format.template;
		const sanitize = true;

		const minetype = (config.Format.type === "custom") ? config.Format.minetype : "text/plain";
		const tabs     = await getAllTabs();

		const getFilteredTabs = (tabs, config, action) => {
			const urlList      = (tabs).map((tab) => { return tab.url; });
			const filtering    = config.Filtering.Copy.enable;
			const allowUrlList = new Set(filteringList(urlList, filtering, action));
			const filtered     = (tabs).filter((tab) => allowUrlList.has(tab.url));  // 全タブから allowUrlList に登録済みの URL を持つタブだけを取得

			return filtered;
		};

		const filteredTabs = getFilteredTabs(tabs, config, action);
		const text         = FormatManager.format(filteredTabs, type, template, sanitize);
		const num          = filteredTabs?.length ? filteredTabs.length : false;
		const status       = await ClipboardManager.write(text, minetype);

		const result = {
			action     : action,
			status     : status,
			message    : status ? (num ? `${num} URLs copied !` : "Not found URLs.") : "Could not access to clipboard.",
			judgment   : status ? true : false,
			urlList    : [],
			clipboard  : {
				direction : "From Tabs to Clipboard",
				text      : text
			}
		};

		return result;
	}

	/**
	 * 「クリップボードから取得したURLをタブで開く」の前処理
	 * @param   {string} action
	 * @param   {object} config - status.config
	 * @returns {object}
	 */
	async function eventSetURLforTab(action, config) {
		const regSearch = config.Search.regex;

		const status    = await ClipboardManager.readText();
		const text      = status ? status : "";
		const array     = getUrlList(text, regSearch);
		const filtering = config.Filtering.Paste.enable;
		const urlList   = filteringList(array, filtering, action);
		const num       = (urlList && Array.isArray(urlList) && urlList?.length) ? urlList.length : null;

		const result = {
			action    : action,
			status    : status,
			message   : status ? ((num && typeof num === "number") ? `${num} URLs open !` : "Not found URLs.") : "Could not access to clipboard.",
			judgment  : (status && num) ? true : false,
			urlList   : urlList,
			clipboard : {
				direction : "From Clipboard to Tabs",
				text      : text
			}
		};

		return result;
	}

	async function eventOpenOptionsPage() {
		chrome.runtime.openOptionsPage();

		window.setTimeout(() => { window.close(); }, 100);
	}

	function eventDoNotMatch(action) {
		// debug
		console.error("Error, Do not match any switch statement. >> eventOnClick(action)", action);
	}

	/**
	 * @return {chrome.tabs.Tab[]}
	 */
	async function getAllTabs() {
		/*
			currentWindow : カレントウインドウの中のタブか？
		*/
		const queryInfo = { currentWindow : true };
		const tabs      = await chrome.tabs.query(queryInfo);  // tabs.query() : https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/query

		return tabs;
	}

	/**
	 * @param    {string} text
	 *  @returns {string[]}
	 */
	function getUrlList(text, regSearch) {
		const array = regSearch ? (text).match(/(https?):\/\/[a-z0-9/:%_+.,#?!@&=-]+/gi) : text.split("\n");

		if ( !array || !Array.isArray(array)) {
			return [];
		}

		// 空配列除去
		const result = (array).filter(
			(elm) => {
				const str = elm.trim();

				return (typeof str === "string" && str.length);
			}
		);

		return result;
	}

	function filteringList(urlList, filtering, action) {
		const config = status.config;
		const define = status.define;

		const getRegexProtocol = (config, define) => {
			const protocol = config.Filtering.Protocol;
			const array    = [];

			for (const key in protocol) {
				if ( protocol[key] ) {
					array.push(key);
				}
			}
			// Chrome 系ブラウザ対応の追加処理@2024/10/15
			if ( config.Filtering.Protocol.chrome ) {
				(define.ChromiumBasedBrowser).forEach(
					(browser) => {
						array.push(browser);
					}
				);
			}
			// debug
			console.log("Debug, Allow Protocol >>", array);

			if ( array.length ) {
				const str = array.join("|");
				const reg = `(${str}):`;

				return (new RegExp(reg, "i"));
			}

			return null;
		};
		const filteringURL = (url) => {
			url = (url).trim();

			// Filtering : is URL ?
			const isURL = URL.canParse(url);
			if ( !isURL ) {
				// debug
				console.log("Debug, Filtering : protocol. Cannot parse URL String >>", url);

				return false;
			}

			// Filtering : Filtering by protocol ?
			if ( !filtering ) {
				return true;
			}

			// Filtering : protocol
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
		const getArrayDiff = (original, target) => {
			const diff = [];

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

		const regex    = getRegexProtocol(config, define);
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

		// アクティブなタブで開くとフォーカスが移動してポップアップメニューが閉じ、処理途中でも終了する為、background.js 側でタブを開く@2024/10/13
		chrome.runtime.sendMessage(message);
	}

	/**
	 * @param   {string} action
	 * @param   {object} result
	 * @returns {string}
	 */
	function createMessage(action, result) {
		if ( !result || !result?.message ) {
			// Debug
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
	 * @param   {string} message
	 * @param   {object} option
	 * @returns {void}
	 */
	function showMessage(message, option) {
		if ( !message || !(typeof message === "string") || !(message.length)) {
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

		const text                              = message;
		const { enable: clear, timeout: delay } = option;
		const msg                               = document.querySelector("#message");

		msg.innerHTML = text;

		if ( clear ) {
			window.setTimeout(() => { msg.innerHTML = ""; }, delay * 1000);
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
			console.log("Debug, Close Popup Menu >>", { close, delay });

			window.setTimeout(() => { window.close(); }, delay * 1000);
		}
	}
</script>



<main>
	<section id="action">
		<ul>
			<li id="copy" class="menu">
				<button class="text" data-action="copy" disabled={ $isActionInProgress } onclick={ eventOnClick }>{ ($isActionInProgress && $appState.currentAction === "copy") ? "Copying..." : "Copy"} </button>
			</li>
			<li id="paste" class="menu">
				<button class="text" data-action="paste" disabled={ $isActionInProgress } onclick={ eventOnClick }>{ ($isActionInProgress && $appState.currentAction === "paste") ? "Pasting..." : "Paste" } </button>
			</li>
		</ul>
	</section>

	<section id="toolbar" class="separator">
		<ul>
			<li id="option" class="menu">
				<button class="text" data-action="options" onclick={ eventOnClick }>Options</button>
			</li>
		</ul>
	</section>

	<section id="message">
		{#if $shouldShowMessage}
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html $appState.message}
		{/if}
	</section>
</main>



<style>
</style>