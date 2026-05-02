// WXT provided cross-browser compatible API.
import { browser } from "wxt/browser";



const manifest = browser.runtime.getManifest();

const Environment = {
	Browser: {
		// This is populated by the getInitDefine function
	}
};

const Information = {
	author     : manifest.author,
	name       : manifest.name,
	description: manifest.description,
	version    : manifest.version,

	BrowserExtensionStore: {
		chrome: {
			title  : `${ manifest.name } - Chrome Web Store`,
			url    : "https://chromewebstore.google.com/detail/glhbfaabeopieaeoojdlaboihfbdjhbm",
			publish: 2024  // Year the extension was published
		},
		firefox: {
			title  : `${ manifest.name } - Mozilla Add-ons`,
			url    : "https://addons.mozilla.org/firefox/addon/copy-url-of-all-tabs/",
			publish: 2025  // Year the extension was published
		}
	},
	github: {
		title : `${ manifest.name } - GitHub`,
		url   : "https://github.com/from-es/copy-url-of-all-tabs",
		issues: "https://github.com/from-es/copy-url-of-all-tabs/issues"
	},
	document: {
		default: {  // Default is for English notation
			title: "User Guide",
			url  : "https://github.com/from-es/copy-url-of-all-tabs/blob/main/docs/UserGuide/README.md"
		},
		ja: {  // Languages are specified with ISO 639-1 two-letter codes >> Used for multi-language support fallbacks
			title: "User Guide (Japanese version)",
			url  : "https://github.com/from-es/copy-url-of-all-tabs/blob/main/docs/UserGuide/README.ja.md"
		}
	},
	updatehistory: {
		title: "Changelog",
		url  : "/changelog.html"
	},

	extension: {
		id: browser.runtime.id
	}
};

const Storage = {
	keyname: "config"
};



export {
	Environment,
	Information,
	Storage
};