// WXT provided cross-browser compatible API and types.
import { browser } from "wxt/browser";

const manifest = browser.runtime.getManifest();

export const Environment = {
	Browser: {
		// これは getInitDefine 関数で埋められる
	}
};

export const Information = {
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
};

export const Storage = {
	keyname: "config"
};