/* eslint-disable indent */

// WXT provided cross-browser compatible API and types.
import { browser, type Browser } from "wxt/browser";

// Import NPM Package
import v8n from "v8n";

// Import Module
import { ArrayOfObjectsValidator } from "@/assets/js/lib/user/ArrayOfObjectsValidator";

// Import Types
import type { BrowserEnvironmentResult }        from "@/assets/js/lib/user/BrowserEnvironment/types";
import type { MessageType }                     from "@/assets/js/lib/user/MessageManager/PopoverMessage";
import type { UrlDelayRule }                    from "@/assets/js/lib/user/UrlDelayCalculator";
import type { TabPosition, TaskMode, OpenMode } from "@/entrypoints/background/js/openUrlsHandler";

// Types
type customDelayInfo = {
	id     : string;  // create by crypto.randomUUID()
	pattern: string;
	delay  : number;
};
type Config_Delta = {
	Search: {
		regex: boolean;
	};
	Filtering: {
		Deduplicate: {
			Copy:  {
				enable: boolean;
			};
			Paste: {
				enable: boolean;
			};
		};
		Protocol: {
			Copy: {
				enable: boolean;
			};
			Paste: {
				enable: boolean;
			};
			type: {
				http:       boolean;
				https:      boolean;
				file:       boolean;
				ftp:        boolean;
				data:       boolean;
				blob:       boolean;
				mailto:     boolean;
				javascript: boolean;
				about:      boolean;
				chrome:     boolean;
			};
		};
	};
	Format: {
		type     : "text" | "json" | "custom";
		template : string;
		minetype?: "text/plain" | "text/html";  // v0.8.2, タイポ修正で削除
		mimetype?: "text/plain" | "text/html";  // v0.8.2, タイポ修正で追加
	};
	Tab: {
		reverse    : boolean;
		active     : boolean;
		delay      : number;
		customDelay: {
			enable: boolean;
			list  : customDelayInfo[];
		};
		position   : TabPosition;
		TaskControl: {
			taskMode : TaskMode;
			openMode : OpenMode;
			chunkSize: number;
		}
	};
	Badge: {
		enable : boolean;
		theme: {
			type : "light" | "dark" | "custom";
			color: {
				text      : string;
				background: string;
			};
		};
	};
};
type Define_Delta = {
	Regex: {
		url: {
			standard: RegExp;
			RFC3986 : RegExp;
			[key: string]: RegExp
		};
		UUID: {
			v4: RegExp
		}
		NeverMatch: RegExp;
	};
	Message: {
		[key: string]: {
			message  : string[];
			timeout  : number;
			fontsize : string;
			color   ?: {
				font      : string;
				background: string;
			};
			messagetype?: MessageType;
		};
	};
	MimeType                             : string[];
	ChromiumBasedBrowser                 : string[];
	OptionsPageFontSizeValueMin          : number;
	OptionsPageFontSizeValueMax          : number;
	OptionsPageFontSizeValueStep         : number;
	PopupMenuFontSizeValueMin            : number;
	PopupMenuFontSizeValueMax            : number;
	PopupMenuFontSizeValueStep           : number;
	PopupMenuClearMessageTimeoutValueMin : number;
	PopupMenuClearMessageTimeoutValueMax : number;
	PopupMenuClearMessageTimeoutValueStep: number;
	PopupMenuOnClickCloseTimeoutValueMin : number;
	PopupMenuOnClickCloseTimeoutValueMax : number;
	PopupMenuOnClickCloseTimeoutValueStep: number;
	TabOpenDelayValueMin                 : number;
	TabOpenDelayValueMax                 : number;
	TabOpenDelayValueStep                : number;
	TabOpenCustomDelayValue              : number;
	TabOpenCustomDelayMatchType          : UrlDelayRule["matchType"]
	TabOpenCustomDelayApplyFrom          : number;
	DisabledTimeoutValue                 : number;
	OptionsPageInputDebounceTime         : number;
	TaskControlChunkSizeValue            : number;
	TaskControlChunkSizeValueMin         : number;
	TaskControlChunkSizeValueMax         : number;
	TaskControlChunkSizeValueStep        : number;
}
type VerificationRule = {
	property: string;
	fail    : () => any;
	rule    : (value: any) => boolean;
};
interface Config extends Config_Delta {
	Information: {
		name   : string | null;
		version: string | null;
		date   : {
			timestamp: number | null;
			iso8601  : string | null;
		};
	};
	Debug: {
		logging       : boolean;
		timestamp     : boolean;
		timecoordinate: "UTC" | "GMT";
	};
	OptionsPage: {
		fontsize: number;
	};
	PopupMenu: {
		fontsize    : number;
		ClearMessage: {
			enable : boolean;
			timeout: number;
		};
		OnClickClose: {
			enable : boolean;
			timeout: number;
		};
	};
};
interface Define extends Define_Delta {
	Environment: {
		Browser: Partial<BrowserEnvironmentResult>;
	};
	Information: {
		author     : string | { email: string; } | undefined;
		name       : string;
		description: string | undefined;
		version    : string;
		BrowserExtensionStore: {
			[key: string]: { // "chrome", "firefox"
				title  : string;
				url    : string;
				publish: number;
			}
		};
		github: {
			title: string;
			url  : string;
		};
		document: {
			[key: string]: {
				title: string;
				url  : string;
			}
		};
		updatehistory: {
			title: string;
			url  : string;
		};
		extension: {
			id: string;
		};
	};
	Storage: {
		keyname: string;
	};

	Config      : Config;
	Verification: VerificationRule[];

	Messaging: {
		[key: string]: string
	};

	// 未定義、差分対応
	[key: string]: string | string[] | number | object;
};



// V8n Custom Rules
v8n.extend({
	// Used for validating the value of "Tab.customDelay.list"
	canParseURL: () => (str) => { return URL.canParse(str); },

	// Used for validating the value of "Badge.theme.color.text" & "Badge.theme.color.background"
	isSupportCssColor: () => (str) => { return CSS.supports("color", str); }
});

const manifest = browser.runtime.getManifest();

const define: Define = {
	Environment: {
		Browser: {
			//
		}
	},

	Information: {
		author     : manifest.author,
		name       : manifest.name,
		description: manifest.description,
		version    : manifest.version,

		BrowserExtensionStore: {
			chrome: {
				title  : `${ manifest.name } - Chrome Web Store`,
				url    : "https://chromewebstore.google.com/detail/glhbfaabeopieaeoojdlaboihfbdjhbm",
				publish: 2024, // 拡張機能の公開した年
			},
			firefox: {
				title  : `${ manifest.name } - Mozilla Add-ons`,
				url    : "https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/",
				publish: 2025, // 拡張機能の公開した年
			}
		},
		github: {
			title: `${ manifest.name } - GitHub`,
			url  : "https://github.com/from-es/copy-url-of-all-tabs"
		},
		document: {
			default: { // デフォルトは英語表記用
				title: "User Guide",
				url  : "https://github.com/from-es/copy-url-of-all-tabs/blob/main/docs/UserGuide/README.md"
			},
			ja: { // 言語別は ISO 639-1 の2文字コードで指定 >> 多言語対応のフォールバック用として使用
				title: "User Guide (Japanese version)",
				url  : "https://github.com/from-es/copy-url-of-all-tabs/blob/main/docs/UserGuide/README.ja.md"
			}
		},
		updatehistory: {
			title: `Update History for ${ manifest.name }`,
			url  : "/changelog.html"
		},

		extension: {
			id: browser.runtime.id
		}
	},

	Storage: {
		keyname: "config"
	},

	Config: {
		Information : {
			name   : null, // manifest.name,
			version: null, // manifest.version
			date   : {
				timestamp: null, // new Date()
				iso8601  : null  // new Date().toISOString()
			}
		},
		Debug : {
			logging       : false, // true >> console 出力を有効にする
			timestamp     : true,  // true >> console 出力にタイムスタンプを付加する
			timecoordinate: "UTC"  // "UTC" or "GMT"
		},
		OptionsPage: {
			fontsize: 16  // 8 ~ 32 px
		},
		PopupMenu : {
			fontsize    : 16,  // 8 ~ 32 px
			ClearMessage: {
				enable : true,
				timeout: 5  // 0 ~ 60 seconds
			},
			OnClickClose: {
				enable : true,
				timeout: 5  // 0 ~ 60 seconds
			}
		},
		Search: {
			regex: true  // true >> search regex, false >> clipboard text split "\n" → test URL.canParse(line text)
		},
		Filtering : {
			Deduplicate: {
				Copy: {
					enable: false
				},
				Paste: {
					enable: false
				}
			},
			Protocol: {
				Copy: {
					enable: true
				},
				Paste: {
					enable: true
				},
				type: {
					/*
				   	Chrome         : FTP Protocol support ends Google Chrome 95 and later
				   	Firefox        : セキュリティの仕様から 特権URL は開けない(https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create#url)
				   	privileged URLs: "about:*****"  (e.x. about:config, about:addons, about:debugging)。ただし非特権URL (about:blank) は使用可
					*/
					http      : true,
					https     : true,
					file      : false,
					ftp       : false,
					data      : false,
					blob      : false,
					mailto    : false,
					javascript: false,
					about     : false,
					chrome    : false,
				}
			}
		},
		Format: {
			type    : "text",                                      // type: "text" or "json" or "custom"
			template: '<a href="$url" title="$title">$title</a>',
			mimetype: "text/plain"                                 // mimetype: "text/plain" or "text/html", Type "text/rtf" not supported on "navigator.clipboard.write()".
		},
		Tab: {
			reverse    : false, // true >> reverse, false >> normal
			active     : false, // タブをアクティブで開くか
			delay      : 250,   // 0 ~ 1000 ms,
			customDelay: {
				enable: false,
				list  : [
					{
						id     : "07db6a58-413e-47de-957d-afd1c8a64f85",
						pattern: "https://x.com/",
						delay  : 1000
					},
					{
						id     : "8f6a9cd0-d62e-4b70-a007-74de6299a50f",
						pattern: "https://www.reddit.com",
						delay  : 1000
					},
					{
						id     : "05fe2b9b-a60c-4707-9a47-a4ccc6e44a73",
						pattern: "https://www.pixiv.net/",
						delay  : 1000
					}
				]
			},
			position: "default", // Tab position when opened: "default" or "first" or "left" or "right" or "last"

			TaskControl: {
				taskMode : "unitary",
				openMode : "append",
				chunkSize: 5
			}
		},
		Badge: {
			enable: false,
			theme : {
				type : "light", // "light", "dark", "custom"
				color: { // "custom" 時のみ、オプション画面から任意色を設定可能
					text      : "#ffffff",
					background: "#767676"
				}
			}
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
			property: "Information.date.timestamp",
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
			property: "Filtering.Deduplicate.Copy.enable",
			fail    : () => { return define.Config.Filtering.Deduplicate.Copy.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Deduplicate.Paste.enable",
			fail    : () => { return define.Config.Filtering.Deduplicate.Paste.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.Copy.enable",
			fail    : () => { return define.Config.Filtering.Protocol.Copy.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.Paste.enable",
			fail    : () => { return define.Config.Filtering.Protocol.Paste.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type",
			fail    : () => { return define.Config.Filtering.Protocol.type; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.object()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.http",
			fail    : () => { return define.Config.Filtering.Protocol.type.http; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.https",
			fail    : () => { return define.Config.Filtering.Protocol.type.https; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.file",
			fail    : () => { return define.Config.Filtering.Protocol.type.file; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.ftp",
			fail    : () => { return define.Config.Filtering.Protocol.type.ftp; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.data",
			fail    : () => { return define.Config.Filtering.Protocol.type.data; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.blob",
			fail    : () => { return define.Config.Filtering.Protocol.type.blob; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.mailto",
			fail    : () => { return define.Config.Filtering.Protocol.type.mailto; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.javascript",
			fail    : () => { return define.Config.Filtering.Protocol.type.javascript; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.about",
			fail    : () => { return define.Config.Filtering.Protocol.type.about; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Filtering.Protocol.type.chrome",
			fail    : () => { return define.Config.Filtering.Protocol.type.chrome; },
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
			property: "Format.mimetype",
			fail    : () => { return define.Config.Format.mimetype; },
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
			property: "Tab.customDelay.enable",
			fail    : () => { return define.Config.Tab.customDelay.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Tab.customDelay.list",
			fail    : () => { return define.Config.Tab.customDelay.list; },
			rule    : (value) => {
							const ValidationRules = {
								id     : v8n().string().pattern(define.Regex.UUID.v4),
								pattern: v8n().string().canParseURL(),
								delay  : v8n().integer().between(define.TabOpenDelayValueMin, define.TabOpenDelayValueMax),
							};
							const option = {
								allowEmptyArray            : true,
								continueOnArrayTypeMismatch: true, // デバック用、本番環境へのビルド時は false を指定 >> 設定保存 or インポート時に厳重検証
								continueOnMissingKeys      : true, // デバック用、本番環境へのビルド時は false を指定 >> 設定保存 or インポート時に厳重検証
							};

							const validator      = new ArrayOfObjectsValidator();
							const result         = validator.validate(value, ValidationRules, option);
							const { isAllValid } = result;

							console.debug("Validation Data & v8n Custom Rule Object: Tab.customDelay.list >>", { value, ValidationRules });

							// debug, Report the result to the console
							validator.reportToConsole();

							return isAllValid;
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
		{
			property: "Tab.TaskControl.openMode",
			fail    : () => { return define.Config.Tab.TaskControl.openMode; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(parallel|append|prepend|insertNext)$/i)
									.test(value);
						}
		},
		{
			property: "Tab.TaskControl.taskMode",
			fail    : () => { return define.Config.Tab.TaskControl.taskMode; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(unitary|batch|monolithic)$/i)
									.test(value);
						}
		},
		{
			property: "Tab.TaskControl.chunkSize",
			fail    : () => { return define.Config.Tab.TaskControl.chunkSize; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.numeric()
									.range(define.TaskControlChunkSizeValueMin, define.TaskControlChunkSizeValueMax)
									.test(value);
						}
		},


		// Badge
		{
			property: "Badge.enable",
			fail    : () => { return define.Config.Badge.enable; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.boolean()
									.test(value);
						}
		},
		{
			property: "Badge.theme",
			fail    : () => { return define.Config.Badge.theme; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.object()
									.test(value);
						}
		},
		{
			property: "Badge.theme.type",
			fail    : () => { return define.Config.Badge.theme.type; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.pattern(/^(light|dark|custom)$/i)
									.test(value);
						}
		},
		{
			property: "Badge.theme.color",
			fail    : () => { return define.Config.Badge.theme.color; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.object()
									.test(value);
						}
		},
		{
			property: "Badge.theme.color.text",
			fail    : () => { return define.Config.Badge.theme.color.text; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.isSupportCssColor()
									.test(value);
						}
		},
		{
			property: "Badge.theme.color.background",
			fail    : () => { return define.Config.Badge.theme.color.background; },
			rule    : (value) => {
								return v8n()
									.not.undefined()
									.not.null()
									.string()
									.isSupportCssColor()
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
		url: {
			standard: /(https?):\/\/(?:[-\w.])+(?:\\:[0-9]+)?(?:\/(?:[\w\\._~:/?#[\]@!$&"()*+,;=%-])*)?/gi,
			RFC3986 : /https?:\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::[1-9][0-9]{0,4})?(?:\/[a-z0-9._~:/?#[\]@!$&"()*+,;=%-]*)?/gi,

			// Basic認証対応
			RFC3986WithAuth: /https?:\/\/(?:[a-z0-9._~%!$&'()*+,;=:-]+(?::[a-z0-9._~%!$&'()*+,;=:-]+)?@)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::[1-9][0-9]{0,4})?(?:\/[a-z0-9._~:/?#[\]@!$&"'()*+,;=%-]*)?/gi
		},
		UUID: {
			v4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
		},
		NeverMatch: /(?!)/
	},

	Message: {
		// Flash Message : options.html >> main.svelte
		Setting_OnClick_SaveButton_Success: {
			message : [ "Save Extension Settings." ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#009933"
			}
		},
		Setting_OnClick_ResetButton: {
			message : [ "Reset, Extension Settings to Default." ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#009933"
			}
		},
		Setting_ImportConfig_Success: {
			message : [ "Success, Import Setting." ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#0066ff"
			}
		},
		Setting_ImportConfig_Error: {
			message : [ 'Failed to import the Settings. can"t read Setting File.' ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#cc3300"
			}
		},
		Setting_ExportConfig_Success: {
			message : [ "Success, Export Settings" ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#0066ff"
			}
		},
		Setting_ExportConfig_Error: {
			message : [ "Failed to export the Settings." ],
			timeout : 5000,
			fontsize: "1.0rem",
			color   : {
				font      : "#ffffff",
				background: "#cc3300"
			}
		}
		// ---------------------------------------------------------------------------------------------------------------------------
	},

	MimeType: [
		"text/plain",
		"text/html"
	],

	// Filtering, List for Settings screen URL of Chromium Based Browser
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
	TabOpenDelayValueMin   : 0,     // millisecond
	TabOpenDelayValueMax   : 10000, // millisecond
	TabOpenDelayValueStep  : 1,
	TabOpenCustomDelayValue: 1000,  // millisecond

	TabOpenCustomDelayMatchType: "prefix",
	TabOpenCustomDelayApplyFrom: 2,

	// Options >> Reset Button: ボタン要素の連打対策用
	DisabledTimeoutValue: 1000, // millisecond

	// Options >> Input Tag: オプションページの入力フィールドにおけるデバウンス処理用
	OptionsPageInputDebounceTime: 500, // millisecond

	// TaskControl
	TaskControlChunkSizeValue    : 5,
	TaskControlChunkSizeValueMin : 1,
	TaskControlChunkSizeValueMax : 16,
	TaskControlChunkSizeValueStep: 1,
};



export { define, Config, Define };