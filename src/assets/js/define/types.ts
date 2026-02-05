// Import Types
import type { TabPosition, TaskMode, OpenMode } from "@/entrypoints/background/js/openUrlsHandler";
import type { BrowserEnvironmentResult }        from "@/assets/js/lib/user/BrowserEnvironment/types";
import type { MessageType }                     from "@/assets/js/lib/user/MessageManager/PopoverMessage";
import type { UrlDelayRule }                    from "@/assets/js/lib/user/UrlDelayCalculator";
import type { LogLevel }                        from "@/assets/js/lib/user/ConsoleManager/types";

type TimeZone         = "UTC" | "GMT";
type PatternMatchType = "prefix" | "substring" | "exact" | "regex";
type FormatType       = "text" | "json" | "custom";
type FormatMimeType   = "text/plain" | "text/html";
type BadgeThemeType   = "light" | "dark" | "custom";
type CustomDelayInfo  = {
	id     : string;  // create by crypto.randomUUID()
	enable : boolean;
	pattern: string;
	delay  : number;
};


type Config_Common = {
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
		loglevel      : LogLevel;
		methodLabel   : boolean;
		timestamp     : boolean;
		timecoordinate: TimeZone;
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
		PatternMatch: {
			Copy: {
				enable: boolean;
			};
			Paste: {
				enable: boolean;
			};
			type   : PatternMatchType;
			pattern: string;
		}
	};
	Format: {
		type    : FormatType;
		template: string;
		mimetype: FormatMimeType;
	};
	Tab: {
		reverse    : boolean;
		active     : boolean;
		delay      : number;
		customDelay: {
			enable: boolean;
			list  : CustomDelayInfo[];
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
			type : BadgeThemeType;
			color: {
				text      : string;
				background: string;
			};
		};
	};
};
type Config = Config_Common & Config_Delta;

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
	MimeType            : string[];
	ChromiumBasedBrowser: string[];
	Messaging: {
		[key: string]: string
	};
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
	OptionsPageSortListDebounceTime      : number;
	TaskControlChunkSizeValue            : number;
	TaskControlChunkSizeValueMin         : number;
	TaskControlChunkSizeValueMax         : number;
	TaskControlChunkSizeValueStep        : number;
	ConfigPropertyDisplayNames: {
		readonly Information: "Extension Information";
		readonly Debug      : "Debug Settings";
		readonly OptionsPage: "Options Page Settings";
		readonly PopupMenu  : "Popup Menu Settings";
		readonly Search     : "Search Settings";
		readonly Filtering  : "Filtering Settings";
		readonly Format     : "Format Settings";
		readonly Tab        : "Tab Settings";
		readonly Badge      : "Badge Settings";
	};
}
type VerificationRule = {
	property: string;
	fail    : () => any;
	rule    : (value: any) => boolean;
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
};

export type {
	CustomDelayInfo,
	Config_Delta,

	Define_Delta,
	VerificationRule,
	BrowserEnvironmentResult,
	MessageType,
	UrlDelayRule,

	Define,
	Config
};