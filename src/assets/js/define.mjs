/* eslint-disable indent */

// Import NPM Package
import v8n from "v8n";

const manifest = chrome.runtime.getManifest();

export const define = {
	Environment : {
		Browser : {
			//
		}
	},

	Information : {
		author     : manifest.author,
		name       : manifest.name,
		description: manifest.description,
		version    : manifest.version,

		publish : 2024, // Chrome拡張機能の公開日（年）
		webstote: {
			title: `${ manifest.name } - Chrome Web Store`,
			url  : "https://chromewebstore.google.com/detail/glhbfaabeopieaeoojdlaboihfbdjhbm"
		},
		github : {
			title: `${ manifest.name } - GitHub`,
			url  : "https://github.com/from-es/copy-url-of-all-tabs"
		},
		document : {
			title: ``, // 未使用 >> 多言語対応のフォールバック用として残す
			url  : ""
		},
		updatehistory : {
			title: `Update History for ${ manifest.name }`,
			url  : "/history/index.html"
		},

		extension : {
			id: chrome.runtime.id
		}
	},

	Storage : {
		key: "config"
	},

	Config : {
		Information : {
			name   : null, // manifest.name,
			version: null, // manifest.version
			date   : {
				unixtime: null, // new Date()
				iso8601 : null  // new Date().toISOString()
			}
		},
		Debug : {
			logging       : false, // true >> console 出力を有効にする
			timestamp     : true,  // true >> console 出力にタイムスタンプを付加する
			timecoordinate: "UTC"  // 'UTC' or 'GMT'
		},
		OptionsPage : {
			fontsize: 16
		},
		PopupMenu : {
			fontsize    : 16,
			ClearMessage : {
				enable : true,
				timeout: 5  // 0 ~ 60 seconds
			},
			OnClickClose : {
				enable : true,
				timeout: 5  // 0 ~ 60 seconds
			}
		},
		Search : {
			regex: true  // true >> search regex, false >> clipboard text split '\n' → test URL.canParse(line text)
		},
		Filtering : {
			// Ver 0.6.1.1 まで使用 >> Paste でのみ使用
			// enable : true,

			// Ver 0.7.0 以降対応
			Copy :  {
				enable: true
			},
			Paste : {
				enable: true
			},

			Protocol : { // URI schemes(https://developer.mozilla.org/en-US/docs/Web/URI/Schemes)
				/*
					Chrome          : FTP Protocol support ends Google Chrome 95 and later
					Firefox         : セキュリティの仕様から 特権URL は開けない(https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create#url)
					privileged URLs : "about:*****"  (e.x. about:config, about:addons, about:debugging)。ただし非特権URL (about:blank) は使用可
				*/
				http : true,  // "http:"
				https: true,  // "https:"
				file : false, // "file:"
				ftp  : false, // "ftp:"

				data: false, // "data:"
				blob: false, // "blob:"

				mailto    : false, // "mailto:"
				javascript: false, // "javascript:"

				about: false, // "about:"

				chrome  : false, // "chrome:"
				/*
				edge    : false// "edge:"
				vivaldi : false// "vivaldi:"
				*/
			}
		},
		Format : {
			type    : "text",                                      // type : "text" or "json" or "custom"
			template: '<a href="$url" title="$title">$title</a>',
			minetype: "text/plain"                                 // minetype : "text/plain" or "text/html", Type "text/rtf" not supported on "navigator.clipboard.write()".
		},
		Tab : {
			reverse: false, // true >> reverse, false >> normal
			active : false, // タブをアクティブで開くか
			delay  : 250,   // 0 ~ 1000 ms,

			/*
				"default":
				"first"  :
				"left"   :
				"right"  :
				"last"   :
			*/
			position: "default"
		}
	},

	Verification : [
		// Information
		{
			property: "Information.name",
			fail    : () => { return manifest.name; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.test(value);
						}
		},
		{
			property: "Information.version",
			fail    : () => { return manifest.version; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?$/)
									.test(value);
						}
		},
		{
			property: "Information.date.unixtime",
			fail    : () => { return Date.now(); },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.numeric()
									.test(value);
						}
		},
		{
			property: "Information.date.iso8601",
			fail    : () => { return new Date().toISOString(); },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.test(value);
						}
		},

		// OptionsPage
		{
			property: "OptionsPage.fontsize",
			fail    : () => { return define.Config.OptionsPage.fontsize; },
			rule    : (value) => {
								return v8n()
								.not.undefined()
								.not.null()
								.numeric()
								.between(define.OptionsPageFontSizeValueMin, define.OptionsPageFontSizeValueMax)
								.test(value);
						}
		},

		// PopupMenu
		{
			property: "PopupMenu.fontsize",
			fail    : () => { return define.Config.PopupMenu.fontsize; },
			rule    : (value) => {
								return v8n()
								.not.undefined()
								.not.null()
								.numeric()
								.between(define.PopupMenuFontSizeValueMin, define.PopupMenuFontSizeValueMax)
								.test(value);
						}
		},
		{
			property: "PopupMenu.ClearMessage.enable",
			fail    : () => { return define.Config.PopupMenu.ClearMessage.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "PopupMenu.ClearMessage.timeout",
			fail    : () => { return define.Config.PopupMenu.ClearMessage.timeout; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.numeric()
									.range(define.PopupMenuClearMessageTimeoutValueMin, define.PopupMenuClearMessageTimeoutValueMax)
									.test(value);
							}
		},
		{
			property: "PopupMenu.OnClickClose.enable",
			fail    : () => { return define.Config.PopupMenu.OnClickClose.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "PopupMenu.OnClickClose.timeout",
			fail    : () => { return define.Config.PopupMenu.OnClickClose.timeout; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.numeric()
									.range(define.PopupMenuOnClickCloseTimeoutValueMin, define.PopupMenuOnClickCloseTimeoutValueMax)
									.test(value);
							}
		},

		// Search
		{
			property: "Search.regex",
			fail    : () => { return define.Config.Search.regex; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},

		// Filtering
		{
			property: "Filtering.Copy.enable",
			fail    : () => { return define.Config.Filtering.Copy.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Paste.enable",
			fail    : () => { return define.Config.Filtering.Paste.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		/*
		{
			property: 'Filtering.enable',                               // Ver 0.6.1.1 まで使用 >> Paste でのみ使用
			fail    : () => { return define.Config.Filtering.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		*/

		{
			property: "Filtering.Protocol",
			fail    : () => { return define.Config.Filtering.Protocol; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.object()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.http",
			fail    : () => { return define.Config.Filtering.Protocol.http; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.https",
			fail    : () => { return define.Config.Filtering.Protocol.https; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.file",
			fail    : () => { return define.Config.Filtering.Protocol.file; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.ftp",
			fail    : () => { return define.Config.Filtering.Protocol.ftp; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.data",
			fail    : () => { return define.Config.Filtering.Protocol.data; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.blob",
			fail    : () => { return define.Config.Filtering.Protocol.blob; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.mailto",
			fail    : () => { return define.Config.Filtering.Protocol.mailto; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.javascript",
			fail    : () => { return define.Config.Filtering.Protocol.javascript; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.about",
			fail    : () => { return define.Config.Filtering.Protocol.about; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Filtering.Protocol.chrome",
			fail    : () => { return define.Config.Filtering.Protocol.chrome; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},

		// Format
		{
			property: "Format.type",
			fail    : () => { return define.Config.Format.type; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(text|json|custom)$/i)
									.test(value);
							}
		},
		{
			property: "Format.template",
			fail    : () => { return define.Config.Format.template; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.test(value);
							}
		},
		{
			property: "Format.minetype",
			fail    : () => { return define.Config.Format.minetype; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(text\/plain|text\/html)$/i)
									.test(value);
							}
		},

		// Tab
		{
			property: "Tab.reverse",
			fail    : () => { return define.Config.Tab.reverse; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Tab.active",
			fail    : () => { return define.Config.Tab.active; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
							}
		},
		{
			property: "Tab.delay",
			fail    : () => { return define.Config.Tab.delay; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.numeric()
									.range(define.TabOpenDelayValueMin, define.TabOpenDelayValueMax)
									.test(value);
							}
		},
		{
			property: "Tab.position",
			fail    : () => { return define.Config.Tab.position; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(default|first|left|right|last)$/i)
									.test(value);
							}
		},

		// Debug
		{
			property: "Debug.logging",
			fail    : () => { return define.Config.Debug.logging; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Debug.timestamp",
			fail    : () => { return define.Config.Debug.timestamp; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Debug.timecoordinate",
			fail    : () => { return define.Config.Debug.timecoordinate; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(UTC|GMT)$/i)
									.test(value);
						}
		}
	],

	Messaging: {
		OpenURLs: "Open Tabs all the URLs in the clipboard.", // popup.js → background.js
	},

	Regex: {
		url: ""  // URL - 正規表現サンプル集(https://www.megasoft.co.jp/mifes/seiki/s310.html)
	},

	Message : {
		// Flash Message : options.html >> main.svelte
		Setting_OnClick_SaveButton_Success : {
			message : [ "Save Extension Settings." ],
			timeout : 5000,
			fontsize: "16px",
			color   : {
				font      : "#ffffff",
				background: "#009933"
			}
		},
		Setting_OnClick_ResetButton : {
			message : [ "Reset, Extension Settings to Default." ],
			timeout : 5000,
			fontsize: "16px",
			color   : {
				font      : "#ffffff",
				background: "#009933"
			}
		},
		Setting_ImportConfig_Success : {
			message : [ "Success, Import Setting." ],
			timeout : 5000,
			fontsize: "16px",
			color   : {
				font      : "#ffffff",
				background: "#0066ff"
			}
		},
		Setting_ImportConfig_Error : {
			message : [ "Failed to import the Settings. can't read Setting File." ],
			timeout : 5000,
			fontsize: "16px",
			color   : {
				font      : "#ffffff",
				background: "#cc3300"
			}
		},
		Setting_OnClick_ExportButton : {
			message : [ "Export Settings" ],
			timeout : 5000,
			fontsize: "16px",
			color   : {
				font      : "#ffffff",
				background: "#0066ff"
			}
		}
		// ---------------------------------------------------------------------------------------------------------------------------
	},

	/*
		未使用@2024/10/21

		const result = (function (array) {
			const str     = (array).join("|");
			const pattern = `^(${str})$`;
			const regex   = new RegExp(pattern, "i");

			return regex
		}(define.MineType));
	*/
	MineType: [
		"text/plain",
		"text/html"
	],

	/*
		Filtering, List for Settings screen URL of Chromium Based Browser
		update: 2024/10/15
	*/
	ChromiumBasedBrowser: [
		"edge",    // edge://
		"vivaldi"  // vivaldi://
	],

	// OptionsPage
	OptionsPageFontSizeValueMin : 8,   // px
	OptionsPageFontSizeValueMax : 32,  // px
	OptionsPageFontSizeValueStep: 1,

	// PopupMenu
	PopupMenuFontSizeValueMin : 8,   // px
	PopupMenuFontSizeValueMax : 32,  // px
	PopupMenuFontSizeValueStep: 1,

	PopupMenuClearMessageTimeoutValueMin : 0,  // seconds
	PopupMenuClearMessageTimeoutValueMax : 60, // seconds
	PopupMenuClearMessageTimeoutValueStep: 1,

	PopupMenuOnClickCloseTimeoutValueMin : 0,  // seconds
	PopupMenuOnClickCloseTimeoutValueMax : 60, // seconds
	PopupMenuOnClickCloseTimeoutValueStep: 1,

	// Tab
	TabOpenDelayValueMin : 0,      // millisecond
	TabOpenDelayValueMax : 10000,  // millisecond
	TabOpenDelayValueStep: 1
};