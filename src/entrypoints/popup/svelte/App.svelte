<script>
	// Import Svelte
	import { onMount } from "svelte";

	// Import from Script
	import { initializeConfig } from "@/assets/js/initializeConfig.mjs";
	import { ClipboardManager } from "@/assets/js/lib/user/ClipboardManager.mjs";
	import { FormatManager }    from "../js/FormatManager.mjs";

	let { status } = $props();

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
		const action = (this).getAttribute("data-action");    // action : true >> 成功 or false >> 失敗
		let   result = {
			action    : null,
			status    : null,    // クリップボードへのアクセス成否
			message   : null,
			judgment  : false,   // 結果の総合判断 >> メッセージ表示用
			urlList   : [],
			clipboard : {
				direction : null, // "From Tabs to Clipboard" or "From Clipboard to Tabs"
				text      : null  // クリップボードの中身
			}
		};

		switch (action) {
			case "copy":
				result = await eventGetURLforAllTabs(action, config);
				break;
			case "paste":
				result = await eventSetURLforTab(action, config);
				break;
			case "options":
				eventOpenOptionsPage();
				break;
			default:
				eventDoNotMatch(action);
				break;
		}

		// debug
		console.log("Debug, { action, result } >>", { action, result });

		// Action Paste, Open URLs
		if ( action === "paste" ) {
			const urlList = result.urlList;
			const option  = config.Tab;

			openURLs(urlList, option, status);
		}

		const message = createMessage(action, result);
		const option  = config.PopupMenu.ClearMessage;
		if ( message ) {
			showMessage(message, option);
		}

		closePopupMenu(config.PopupMenu.OnClickClose);
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
			const allowUrlList = filteringList(urlList, filtering, action);

			// 要、リファクタリング@2025/01/29
			return (tabs).filter(
				(tab) => {
					// Array.prototype.find() >> テスト関数を満たす配列内の最初の要素を返す。テスト関数を満たす値が無い場合は undefined を返す。
					return (allowUrlList).find((url) => { return (url === tab.url); });
				}
			);
		};
		const filteredTabs = getFilteredTabs(tabs, config, action);

		const text     = FormatManager.format(filteredTabs, type, template, sanitize);
		const num      = filteredTabs?.length ? filteredTabs.length : false;
		const status   = await ClipboardManager.write(text, minetype);

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
		const array = regSearch ? (text).match(/(https?):\/\/[a-z0-9\/:%_+.,#?!@&=-]+/gi) : text.split("\n");

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

		const regex    = getRegexProtocol(config, define);
		const list     = structuredClone(urlList);
		const filtered = (list).filter(filteringURL);
		const result   = (filtered).map((url) => { return url.trim(); });
		const diff     = (list).filter(elm => { return ((result).indexOf(elm) === -1); });

		// debug
		console.log(`Debug, Action ${action}. Filtering >>`,
			{
				list: {
					before : urlList, // 全タブのURL
					after  : result,	// フィルタリング済みURL
					diff   : diff     // 差分 >> フィルタリング対象URL
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
		if ( !result.message ) {
			// Debug
			console.log('Debug, result.message is "null or undefined or empty"! >>', result);

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
				<button class="text" data-action="copy" onclick={ eventOnClick }>Copy</button>
			</li>
			<li id="paste" class="menu">
				<button class="text" data-action="paste" onclick={ eventOnClick }>Paste</button>
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

	<section id="message"></section>
</main>



<style>
</style>