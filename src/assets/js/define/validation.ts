// WXT provided cross-browser compatible API and types.
import { browser } from "wxt/browser";

// Import NPM Package
import v8n from "v8n";

// Import Module
import { defaultConfig }           from "./config";
import { ArrayOfObjectsValidator } from "@/assets/js/lib/user/ArrayOfObjectsValidator";

// Import Types
import type { VerificationRule } from "./types";
import * as Constants            from "./constants";

// v8n Custom Rules
declare module "v8n" {
	export interface V8nValidator {
		canParseURL()      : V8nValidator;
		isSupportCssColor(): V8nValidator;
	}
}
v8n.extend({
	// Used for validating the value of "Tab.customDelay.list"
	canParseURL: () => (str) => { return URL.canParse(str); },

	// Used for validating the value of "Badge.theme.color.text" & "Badge.theme.color.background"
	isSupportCssColor: () => (str) => { return CSS.supports("color", str); }
});

const manifest = browser.runtime.getManifest();

export const VerificationRules: VerificationRule[] = [
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
		fail    : () => { return defaultConfig.OptionsPage.fontsize; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.OptionsPageFontSizeValueMin, Constants.OptionsPageFontSizeValueMax)
				.test(value);
		}
	},

	// PopupMenu
	{
		property: "PopupMenu.fontsize",
		fail    : () => { return defaultConfig.PopupMenu.fontsize; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.PopupMenuFontSizeValueMin, Constants.PopupMenuFontSizeValueMax)
				.test(value);
		}
	},
	{
		property: "PopupMenu.ClearMessage.enable",
		fail    : () => { return defaultConfig.PopupMenu.ClearMessage.enable; },
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
		fail    : () => { return defaultConfig.PopupMenu.ClearMessage.timeout; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.PopupMenuClearMessageTimeoutValueMin, Constants.PopupMenuClearMessageTimeoutValueMax)
				.test(value);
		}
	},
	{
		property: "PopupMenu.OnClickClose.enable",
		fail    : () => { return defaultConfig.PopupMenu.OnClickClose.enable; },
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
		fail    : () => { return defaultConfig.PopupMenu.OnClickClose.timeout; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.PopupMenuOnClickCloseTimeoutValueMin, Constants.PopupMenuOnClickCloseTimeoutValueMax)
				.test(value);
		}
	},

	// Search
	{
		property: "Search.regex",
		fail    : () => { return defaultConfig.Search.regex; },
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
		fail    : () => { return defaultConfig.Filtering.Deduplicate.Copy.enable; },
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
		fail    : () => { return defaultConfig.Filtering.Deduplicate.Paste.enable; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.Copy.enable; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.Paste.enable; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.http; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.https; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.file; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.ftp; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.data; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.blob; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.mailto; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.javascript; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.about; },
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
		fail    : () => { return defaultConfig.Filtering.Protocol.type.chrome; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.boolean()
				.test(value);
		}
	},
	{
		property: "Filtering.PatternMatch.Copy.enable",
		fail    : () => { return defaultConfig.Filtering.PatternMatch.Copy.enable; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.boolean()
				.test(value);
		}
	},
	{
		property: "Filtering.PatternMatch.Paste.enable",
		fail    : () => { return defaultConfig.Filtering.PatternMatch.Paste.enable; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.boolean()
				.test(value);
		}
	},
	{
		property: "Filtering.PatternMatch.type",
		fail    : () => { return defaultConfig.Filtering.PatternMatch.type; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.string()
				.pattern(/^(prefix|substring|exact|regex)$/i)
				.test(value);
		}
	},
	{
		property: "Filtering.PatternMatch.pattern",
		fail    : () => { return defaultConfig.Filtering.PatternMatch.pattern; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.string()
				.test(value);
		}
	},

	// Format
	{
		property: "Format.type",
		fail    : () => { return defaultConfig.Format.type; },
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
		fail    : () => { return defaultConfig.Format.template; },
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
		fail    : () => { return defaultConfig.Format.mimetype; },
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
		fail    : () => { return defaultConfig.Tab.reverse; },
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
		fail    : () => { return defaultConfig.Tab.active; },
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
		fail    : () => { return defaultConfig.Tab.delay; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.TabOpenDelayValueMin, Constants.TabOpenDelayValueMax)
				.test(value);
		}
	},
	{
		property: "Tab.customDelay.enable",
		fail    : () => { return defaultConfig.Tab.customDelay.enable; },
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
		fail    : () => { return defaultConfig.Tab.customDelay.list; },
		rule    : (value) => {
			const ValidationRules = {
				id     : v8n().string().pattern(Constants.Regex.UUID.v4),
				enable : v8n().boolean(),
				pattern: v8n().string().canParseURL(),
				delay  : v8n().integer().range(Constants.TabOpenDelayValueMin, Constants.TabOpenDelayValueMax),
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
		fail    : () => { return defaultConfig.Tab.position; },
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
		fail    : () => { return defaultConfig.Tab.TaskControl.openMode; },
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
		fail    : () => { return defaultConfig.Tab.TaskControl.taskMode; },
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
		fail    : () => { return defaultConfig.Tab.TaskControl.chunkSize; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.numeric()
				.range(Constants.TaskControlChunkSizeValueMin, Constants.TaskControlChunkSizeValueMax)
				.test(value);
		}
	},

	// Badge
	{
		property: "Badge.enable",
		fail    : () => { return defaultConfig.Badge.enable; },
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
		fail    : () => { return defaultConfig.Badge.theme; },
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
		fail    : () => { return defaultConfig.Badge.theme.type; },
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
		fail    : () => { return defaultConfig.Badge.theme.color; },
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
		fail    : () => { return defaultConfig.Badge.theme.color.text; },
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
		fail    : () => { return defaultConfig.Badge.theme.color.background; },
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
		fail    : () => { return defaultConfig.Debug.logging; },
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
		fail    : () => { return defaultConfig.Debug.timestamp; },
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
		fail    : () => { return defaultConfig.Debug.timecoordinate; },
		rule    : (value) => {
			return v8n()
				.not.undefined()
				.not.null()
				.string()
				.pattern(/^(UTC|GMT)$/i)
				.test(value);
		}
	}
];