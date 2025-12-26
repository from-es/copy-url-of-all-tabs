export const Regex = {
	url: {
		standard: /(https?):\/\/(?:[-\w.])+(?::[0-9]+)?(?:\/(?:[\w._~:/?#[\]@!$&"()*+,;=%-])*)?/gi,
		RFC3986 : /(https?):\/\/(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::[1-9][0-9]{0,4})?(?:\/[a-z0-9._~:/?#[\]@!$&"()*+,;=%-]*)?/gi,

		// RFC3986 & Basic認証対応
		RFC3986WithAuth: /https?:\/\/(?:[a-z0-9._~%!$&'()*+,;=:-]+(?::[a-z0-9._~%!$&'()*+,;=:-]+)?@)?(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?::[1-9][0-9]{0,4})?(?:\/[a-z0-9._~:/?#[\]@!$&"'()*+,;=%-]*)?/gi,

		// RFC3986 にホスト名にアンダースコアを許容 & Basic認証対応
		RFC3986LooseWithAuth: /https?:\/\/(?:[a-z0-9._~%!$&'()*+,;=:-]+(?::[a-z0-9._~%!$&'()*+,;=:-]+)?@)?(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?(?::[1-9][0-9]{0,4})?(?:\/[a-z0-9._~:/?#[\]@!$&"'()*+,;=%-]*)?/gi
	},
	UUID: {
		v4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
	},
	NeverMatch: /(?!)/
};

export const Messaging = {
	OpenURLs: "Open Tabs all the URLs in the clipboard.", // popup.js → background.js
};

// Flash Message: options.html >> main.svelte
export const Message = {
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
	},
	Setting_AutoCorrect: {
		message: [
			"Save was canceled because some settings were invalid. Please review and save again.",
			"The following items need correction:"
		],
		timeout: 10000,
		fontsize: "1.0rem",
		color: {
			font: "#ffffff",
			background: "#ff9800" // Warning color (Orange)
		}
	},
	Setting_UnexpectedError: {
		message: [ "An unexpected error occurred while saving the settings." ],
		timeout: 5000,
		fontsize: "1.0rem",
		color: {
			font: "#ffffff",
			background: "#cc3300" // Error color (Red)
		}
	}
};

export const MimeType = [
	"text/plain",
	"text/html"
];

// Filtering, List for Settings screen URL of Chromium Based Browser
export const ChromiumBasedBrowser = [
	"edge",    // edge://
	"vivaldi"  // vivaldi://
];


// OptionsPage
export const OptionsPageFontSizeValueMin           = 8;   // px
export const OptionsPageFontSizeValueMax           = 32;  // px
export const OptionsPageFontSizeValueStep          = 1;

// PopupMenu
export const PopupMenuFontSizeValueMin             = 8;   // px
export const PopupMenuFontSizeValueMax             = 32;  // px
export const PopupMenuFontSizeValueStep            = 1;

export const PopupMenuClearMessageTimeoutValueMin  = 0;   // seconds
export const PopupMenuClearMessageTimeoutValueMax  = 60;  // seconds
export const PopupMenuClearMessageTimeoutValueStep = 1;

export const PopupMenuOnClickCloseTimeoutValueMin  = 0;   // seconds
export const PopupMenuOnClickCloseTimeoutValueMax  = 60;  // seconds
export const PopupMenuOnClickCloseTimeoutValueStep = 1;

// Tab
export const TabOpenDelayValueMin                  = 0;      // millisecond
export const TabOpenDelayValueMax                  = 10000;  // millisecond
export const TabOpenDelayValueStep                 = 1;
export const TabOpenCustomDelayValue               = 1000;   // millisecond

export const TabOpenCustomDelayMatchType           = "prefix";
export const TabOpenCustomDelayApplyFrom           = 2;

// Options >> Reset Button: ボタン要素の連打対策用
export const DisabledTimeoutValue                  = 1000;  // millisecond

// Options >> デバウンス処理用
export const OptionsPageInputDebounceTime          = 500;  // millisecond >> オプションページの入力フィールドの待ち時間
export const OptionsPageSortListDebounceTime       = 500;  // millisecond >> オプションページのソート対応リストの待ち時間

// TaskControl
export const TaskControlChunkSizeValue             = 5;
export const TaskControlChunkSizeValueMin          = 1;
export const TaskControlChunkSizeValueMax          = 16;
export const TaskControlChunkSizeValueStep         = 1;

// 設定検証時に不正な値が検出された設定の項目
export const ConfigPropertyDisplayNames = {
	Information: "Extension Information",
	Debug      : "Debug Settings",
	OptionsPage: "Options Page Settings",
	PopupMenu  : "Popup Menu Settings",
	Search     : "Search Settings",
	Filtering  : "Filtering Settings",
	Format     : "Format Settings",
	Tab        : "Tab Settings",
	Badge      : "Badge Settings"
} as const;