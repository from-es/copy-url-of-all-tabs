import type { UserManifest } from "wxt";



const manifest: UserManifest =
{
	"manifest_version": 3,

	/**
		Author keys will no longer be supported by Chrome and the Chrome Web Store after February 2024 (https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/author)
	*/
	"author": "From E",

	"name"       : "Copy URL of All Tabs",
	"description": "Copy, Copy all Tabs URLs to the clipboard. Paste, Open Tabs all the URLs in the clipboard.",
	"version"    : "1.0.3",

	/**
		CSS
			:has() >> Google Chrome 105 & later (https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
		JavaScript
			URL.canParse() >> Google Chrome 120 & later (https://developer.mozilla.org/en-US/docs/Web/API/URL/canParse_static)
			Error: cause   >> Google Chrome 125 & later (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause)
	*/
	"minimum_chrome_version": "125.0",
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



export { manifest };