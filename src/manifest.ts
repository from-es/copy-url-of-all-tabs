import type { UserManifest } from "wxt";
import pkg                   from "../package.json";

export const manifest: UserManifest =
{
	"manifest_version": 3,

	// @ts-expect-error: Chrome no longer supports the "author" key, but we keep it for legacy reasons.
	"author": "From E",

	"name"       : "Copy URL of All Tabs",
	"description": "Copy, Copy all Tabs URLs to the clipboard. Paste, Open Tabs all the URLs in the clipboard.",

	// package.json から取得
	"version": pkg.version,

	/**
		CSS
			:has() (https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
				- Chrome : 105 & later
				- Firefox: 121 & later
		JavaScript
			Popover API (https://developer.mozilla.org/ja/docs/Web/API/Popover_API)
				- Chrome : 114 & later
				- Firefox: 125 & later
			URL.canParse() (https://developer.mozilla.org/en-US/docs/Web/API/URL/canParse_static)
				- Chrome : 120 & later
				- Firefox: 115 & later
			Error: cause (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
				- Chrome : 125 & later
				- Firefox:  91 & later
			Clipboard API: ClipboardItem (https://developer.mozilla.org/en-US/docs/Web/API/ClipboardItem)
				- Chrome :  76 & later
				- Firefox: 127 & later
	*/
	// for Google Chrome or Chromium-based browsers
	"minimum_chrome_version": "125.0",

	// for Mozilla Firefox or Firefox-based browsers
	"browser_specific_settings": {
		"gecko": {
			"id"                : "{e590379c-55b4-4aaa-b94b-cd45d5b173f7}",
			"strict_min_version": "127.0"
		}
	},

	"icons" : {
		"16" : "/src/img/icon_16.png",
		"32" : "/src/img/icon_32.png",
		"48" : "/src/img/icon_48.png",
		"128": "/src/img/icon_128.png"
	},
	"action": {
		"default_title": "Copy URL of All Tabs",
		"default_popup": "/popup.html",
		"default_icon" : {
			"16" : "/src/img/icon_16.png",
			"32" : "/src/img/icon_32.png",
			"48" : "/src/img/icon_48.png",
			"128": "/src/img/icon_128.png"
		},
	},
	"permissions": [
		"tabs",
		"storage",
		"clipboardRead",
		"clipboardWrite"
	],
	"background": {
		"service_worker": "/background.js",
		"type"          : "module"
	},
	"content_scripts": [
		// Nothing
	],
	"options_ui": {
		"open_in_tab": true,
		"page"       : "/options.html"
	}
};