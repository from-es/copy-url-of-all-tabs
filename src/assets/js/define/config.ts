// Import Types
import type { Config } from "./types";

export const defaultConfig: Config = {
	Information: {
		name   : null,  // manifest.name,
		version: null,  // manifest.version
		date   : {
			timestamp: null,  // new Date()
			iso8601  : null   // new Date().toISOString()
		}
	},
	Debug: {
		logging       : true,   // true >> Enables console output
		loglevel      : "warn", // "all" | "trace" | "debug" | "info" | "warn" | "error" | "silent"
		methodLabel   : true,   // true >> Appends method labels to console output
		timestamp     : true,   // true >> Appends timestamps to console output
		timecoordinate: "UTC",  // "UTC" or "GMT"
	},
	OptionsPage: {
		fontsize: 16  // 8 ~ 32 px
	},
	PopupMenu: {
		fontsize    : 16, // 8 ~ 32 px
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
	Filtering: {
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
					Firefox        : Privileged URLs cannot be opened due to security specifications (https://developer.mozilla.org/ja/docs/Mozilla/Add-ons/WebExtensions/API/tabs/create#url)
					privileged URLs: "about:*****" (e.g., about:config, about:addons, about:debugging). Unprivileged URLs (about:blank) can still be used.
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
		},
		PatternMatch: {
			Copy: {
				enable: false
			},
			Paste: {
				enable: false
			},
			type   : "prefix",
			pattern: "// Prefix\nhttps://example.com\nhttps://example.net\nhttps://example.org\nhttps://example.edu"
		}
	},
	Format: {
		type    : "text",                                      // type: "text" or "json" or "custom"
		template: '<a href="$url" title="$title">$title</a>',
		mimetype: "text/plain"                                 // mimetype: "text/plain" or "text/html", Type "text/rtf" not supported on "navigator.clipboard.write()".
	},
	Tab: {
		reverse    : false,  // true >> reverse, false >> normal
		active     : false,  // Whether to open tabs as active
		delay      : 250,    // 0 ~ 1000 ms,
		customDelay: {
			enable: false,
			list  : [
				{
					id     : "07db6a58-413e-47de-957d-afd1c8a64f85",
					enable : true,
					pattern: "https://x.com/",
					delay  : 1000
				},
				{
					id     : "8f6a9cd0-d62e-4b70-a007-74de6299a50f",
					enable : true,
					pattern: "https://www.reddit.com",
					delay  : 1000
				},
				{
					id     : "05fe2b9b-a60c-4707-9a47-a4ccc6e44a73",
					enable : true,
					pattern: "https://www.pixiv.net/",
					delay  : 1000
				}
			]
		},
		position: "default",  // Tab position when opened: "default" or "first" or "left" or "right" or "last"

		TaskControl: {
			taskMode : "unitary",
			openMode : "append",
			chunkSize: 5
		}
	},
	Badge: {
		enable: false,
		theme : {
			type : "light",  // "light", "dark", "custom"
			color: {         // In "custom" mode, arbitrary colors can be set from the options screen
				text      : "#ffffff",
				background: "#767676"
			}
		}
	}
};