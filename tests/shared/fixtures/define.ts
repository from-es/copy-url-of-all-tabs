import type { Config, Define } from "@/assets/js/types";

/**
 * Generates a default Define object for development and testing.
 *
 * @param {Config} config - Base Config object (optional)
 * @returns {Define} Initial state Define object
 */
export const createMockDefine = (config: Config): Define => ({
	Environment: {
		Browser: {}
	},
	Information: {
		author     : "Test Author",
		name       : "Test Extension",
		description: "Test Description",
		version    : "1.1.0",
		BrowserExtensionStore: {
			chrome : { title: "", url: "", publish: 0 },
			firefox: { title: "", url: "", publish: 0 }
		},
		github: {
			title : "",
			url   : "",
			issues: ""
		},
		document: {
			default: { title: "", url: "" }
		},
		updatehistory: {
			title: "",
			url  : ""
		},
		extension: {
			id: ""
		}
	},
	Storage     : { keyname: "config" },
	Config      : config,
	Verification: [],
	Messaging   : {},
	Regex: {
		url           : { standard: /a/, RFC3986: /b/ },
		UUID          : { v4: /d/ },
		MetaCharacters: /[.*+?^${}()|[\]\\]/g,
		NeverMatch    : /e/
	},
	Message             : {},
	MimeType            : [],
	ChromiumBasedBrowser: [],

	OptionsPageFontSizeValueMin: 8,
	OptionsPageFontSizeValueMax: 32,
	OptionsPageFontSizeValueStep: 1,

	PopupMenuFontSizeValueMin : 8,
	PopupMenuFontSizeValueMax : 32,
	PopupMenuFontSizeValueStep: 1,

	PopupMenuClearMessageTimeoutValueMin : 0,
	PopupMenuClearMessageTimeoutValueMax : 60,
	PopupMenuClearMessageTimeoutValueStep: 1,

	PopupMenuOnClickCloseTimeoutValueMin : 0,
	PopupMenuOnClickCloseTimeoutValueMax : 60,
	PopupMenuOnClickCloseTimeoutValueStep: 1,

	TabOpenDelayValueMin       : 0,
	TabOpenDelayValueMax       : 10000,
	TabOpenDelayValueStep      : 1,
	TabOpenCustomDelayValue    : 1000,
	TabOpenCustomDelayMatchType: "prefix",
	TabOpenCustomDelayApplyFrom: 2,

	DisabledTimeoutValue           : 1000,
	OptionsPageInputDebounceTime   : 500,
	OptionsPageSortListDebounceTime: 500,

	TaskControlChunkSizeValue    : 5,
	TaskControlChunkSizeValueMin : 1,
	TaskControlChunkSizeValueMax : 16,
	TaskControlChunkSizeValueStep: 1,

	ConfigPropertyDisplayNames: {
		Information: "Extension Information",
		Debug      : "Debug Settings",
		OptionsPage: "Options Page Settings",
		PopupMenu  : "Popup Menu Settings",
		Search     : "Search Settings",
		Filtering  : "Filtering Settings",
		Format     : "Format Settings",
		Tab        : "Tab Settings",
		Badge      : "Badge Settings"
	} as const
});