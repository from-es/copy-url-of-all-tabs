/**
 * Sequence rule definitions for the v1 series of settings.
 *
 * @file
 * @lastModified 2026-06-20
 */

// Import Module
import { cloneObject }     from "@/assets/js/lib/CloneObject";
import { compareVersions } from "@/assets/js/utils/CompareVersions";

// Import Object
import { define } from "@/assets/js/define";

// Import Types
import type { Config }       from "@/assets/js/types";
import type { SequenceRule } from "@/assets/js/lib/SequenceProcessor/types";

/**
 * An array that defines the configuration sequence rules.
 * Each rule encapsulates the conditions and execution logic for applying specific configuration changes.
 *
 * @see {@link ../../../../lib/SequenceProcessor/doc/SequenceRule.md}
 */
export const rules: SequenceRule<Config, Partial<Config>>[] = [
	{
		meta: {
			name       : "RenameFilteringEnable",
			author     : "From E",
			authored   : "2025-01-29",
			version    : "0.7.0",
			description: {
				reason: "To maintain backward compatibility after renaming properties following the addition of Copy & Paste settings (allowing URL filtering to be applied individually to each) in the v0.7.0 update.",
				target: "config.Filtering.enable",
				action: "Copy the value of config.Filtering.enable to new config.Filtering.Copy.enable and config.Filtering.Paste.enable properties, then delete config.Filtering.enable."
			}
		},
		spec: {
			lifecycle: { introduced: "0.7.0" }
		},
		order: 1,
		process: {
			condition: ({ data }) => Object.hasOwn(data?.Filtering ?? {}, "enable"),
			execute  : ({ data }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newData = cloneObject(data) as any;

				// Migration
				newData.Filtering.Copy  = { enable: true };
				newData.Filtering.Paste = { enable: newData.Filtering.enable };

				// Delete
				delete newData.Filtering.enable;

				console.info("INFO(sequence): migrate config of value: change data.filtering.enable to data.filtering.copy.enable and data.filtering.paste.enable", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "FixFormatMimetypeTypo",
			author     : "From E",
			authored   : "2025-07-11",
			version    : "1.0.0",
			description: {
				reason: "Typo in the property name config.Format.mimetype as config.Format.minetype.",
				target: "config.Format.minetype",
				action: "Fix the property name from minetype to mimetype, copy the value of minetype, and then delete minetype."
			}
		},
		spec: {
			lifecycle: { introduced: "1.0.0" }
		},
		order: 2,
		process: {
			condition: ({ data }) => Object.hasOwn(data.Format, "minetype"),
			execute  : ({ data }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newData = cloneObject(data) as any;

				// Migration
				newData.Format.mimetype = newData.Format.minetype;

				// Delete
				delete newData.Format.minetype;

				console.info("INFO(sequence): migrate config of value: change data.format.minetype to data.format.mimetype", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddTabCustomDelayDefault",
			author     : "From E",
			authored   : "2025-08-01",
			version    : "1.0.0",
			description: {
				reason: "To add default values for the feature to delay individual tabs (Tab.customDelay) introduced in v1.0.0 if they do not exist.",
				target: "config.Tab.customDelay",
				action: "Add default values if config.Tab.customDelay does not exist."
			}
		},
		spec: {
			lifecycle: { introduced: "1.0.0" }
		},
		order: 3,
		process: {
			condition: ({ data }) => !Object.hasOwn(data?.Tab ?? {}, "customDelay"),
			execute  : ({ data, context }) => {
				const newData = cloneObject(data);

				// Add property & apply default value
				if (context.Tab?.customDelay) {
					newData.Tab.customDelay = context.Tab.customDelay;
				}

				console.info("INFO(sequence): add data.tab.customdelay", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "RenameUnixtimeToTimestamp",
			author     : "From E",
			authored   : "2025-10-04",
			version    : "1.4.0",
			description: {
				reason: "The value managed in config.Information.date.unixtime is actually 'UNIX epoch * 1000', which does not match the property name. Therefore, renaming it to config.Information.date.timestamp.",
				target: "config.Information.date.unixtime",
				action: "Copy the value of the unixtime property to timestamp, then delete the unixtime property."
			}
		},
		spec: {
			lifecycle: { introduced: "1.4.0" }
		},
		order: 4,
		process: {
			condition: ({ data }) => Object.hasOwn(data.Information.date, "unixtime"),
			execute  : ({ data }) => {
				const newData  = cloneObject(data);

				// Migration
				const infoDate = newData.Information.date as unknown as Record<string, unknown>;
				newData.Information.date.timestamp = infoDate["unixtime"] as number;

				// Delete
				delete infoDate["unixtime"];

				console.info("INFO(sequence): migrate config of value: change data.information.date.unixtime to data.information.date.timestamp", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "RemoveLegacyCustomDelayUrl",
			author     : "From E",
			authored   : "2025-10-07",
			version    : "1.5.0",
			description: {
				reason: "To remove unnecessary `url` properties caused by data structure inconsistencies when adding custom delay settings between v1.0.0 and v1.4.0, due to an implementation bug on the options page.",
				target: "config.Information.version, config.Tab.customDelay.list[].url",
				action: "Delete the `url` property if the configuration version is v1.4.0 or earlier and the custom delay list contains it."
			}
		},
		spec: {
			lifecycle: { introduced: "1.5.0", obsoleted: "1.5.0" } // Only applicable if introduced in 1.5.0 (actually this logic depends on saved data version, so it's a bit different. Let's keep condition).
		},
		order: 5,
		process: {
			condition: ({ data }) => {
				const isSameOrEarlier = (base: unknown, target: unknown) => {
					const comp = compareVersions(base, target);
					return comp === 0 || comp === -1;
				};

				let   isTargetVersion = false;
				const base            = "1.4.0";
				let   target          = null;

				try {
					target = data.Information?.version ?? "1.0.0";
					isTargetVersion = isSameOrEarlier(base, target);
				} catch (error) {
					console.error("ERROR(sequence): rule error: failed to compare versions", { error });
				}

				const hasUrlPropertyInList = data.Tab?.customDelay?.list?.some(item => Object.hasOwn(item, "url")) ?? false;

				return isTargetVersion && hasUrlPropertyInList;
			},
			execute: ({ data }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newData = cloneObject(data) as any;

				if (newData.Tab?.customDelay?.list) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					newData.Tab.customDelay.list.forEach((item: any) => {
						const legacyItem = item as unknown as Record<string, unknown>;
						if (Object.hasOwn(legacyItem, "url")) {
							delete legacyItem["url"];
						}
					});
				}

				console.info("INFO(sequence): migrate config of value: remove data.tab.customdelay.list.url property", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddTaskControlDefault",
			author     : "From E",
			authored   : "2025-10-18",
			version    : "1.8.0",
			description: {
				reason: "To add default values for the feature to control tab expansion behavior (Tab.TaskControl) introduced in v1.7.0 if they do not exist.",
				target: "config.Tab.TaskControl",
				action: "Add default values if config.Tab.TaskControl does not exist."
			}
		},
		spec: {
			lifecycle: { introduced: "1.8.0" }
		},
		order: 6,
		process: {
			condition: ({ data }) => !Object.hasOwn(data?.Tab ?? {}, "TaskControl"),
			execute  : ({ data, context }) => {
				const newData = cloneObject(data);

				// Add property & apply default value
				if (context.Tab?.TaskControl) {
					newData.Tab.TaskControl = context.Tab.TaskControl;
				}

				console.info("INFO(sequence): add data.tab.taskcontrol", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "RestructureFilteringSettings",
			author     : "From E",
			authored   : "2025-11-01",
			version    : "1.12.0",
			description: {
				reason: "To handle the structural change of `config.Filtering` following the addition of URL deduplication settings in v1.11.0.",
				target: "config.Filtering",
				action: "Restructure Filtering settings into the new structure (Deduplicate and Protocol) and initialize Deduplicate settings."
			}
		},
		spec: {
			lifecycle: { introduced: "1.12.0" }
		},
		order: 7,
		process: {
			condition: ({ data }) => !Object.hasOwn(data?.Filtering ?? {}, "Deduplicate"),
			execute  : ({ data, context }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newData = cloneObject(data) as any;

				// Get values from source (undefined if not present)
				const oldCopyEnable  = newData.Filtering?.Copy?.enable;
				const oldPasteEnable = newData.Filtering?.Paste?.enable;
				const oldProtocol    = newData.Filtering?.Protocol;

				// Create new structure by deep copying from context
				if (context.Filtering) {
					newData.Filtering = cloneObject(context.Filtering);
				}

				// If old values exist, overwrite the new structure
				if (newData.Filtering?.Protocol?.Copy && oldCopyEnable !== undefined) {
					newData.Filtering.Protocol.Copy.enable = oldCopyEnable;
				}
				if (newData.Filtering?.Protocol?.Paste && oldPasteEnable !== undefined) {
					newData.Filtering.Protocol.Paste.enable = oldPasteEnable;
				}

				// Verify that the old Protocol is an object and has an http property (is a protocol definition object)
				if (typeof oldProtocol === "object" && oldProtocol !== null && Object.hasOwn(oldProtocol, "http")) {
					// Overwrite the new `type` object with the old protocol settings (migrate settings)
					Object.assign(newData.Filtering.Protocol.type, oldProtocol);
				}

				console.info("INFO(sequence): migrate config of value: restructure data.filtering", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddBadgeDefault",
			author     : "From E",
			authored   : "2025-11-10",
			version    : "1.12.0",
			description: {
				reason: "To add default values for the badge feature (Badge) that displays the 'number of pending URLs' on the extension icon, introduced in v1.12.0, if they do not exist.",
				target: "config.Badge",
				action: "If config.Badge does not exist, add the property and apply default values."
			}
		},
		spec: {
			lifecycle: { introduced: "1.12.0" }
		},
		order: 8,
		process: {
			condition: ({ data }) => !Object.hasOwn(data, "Badge"),
			execute  : ({ data, context }) => {
				const newData = cloneObject(data);

				// Add property & apply default value
				if (context.Badge) {
					newData.Badge = context.Badge;
				}

				console.info("INFO(sequence): add data.badge", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddEnablePropertyToCustomDelay",
			author     : "From E",
			authored   : "2026-01-16",
			version    : "1.18.0",
			description: {
				reason: "To add an enable/disable flag to each item in CustomDelay in v1.18.0.",
				target: "config.Tab.customDelay.list[].enable",
				action: "Add `enable: true` to each item in config.Tab.customDelay.list if the property is missing."
			}
		},
		spec: {
			lifecycle: { introduced: "1.18.0" }
		},
		order: 9,
		process: {
			condition: ({ data }) => {
				const configVersion = data.Information?.version ?? "0.0.0";
				try {
					if (compareVersions("1.18.0", configVersion) !== -1) {
						return false;
					}
				} catch (error) {
					console.error("ERROR(sequence): rule error: failed to compare versions", { error });
					return false;
				}
				return data.Tab?.customDelay?.list?.some(item => !(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) ?? false;
			},
			execute: ({ data }) => {
				const newData = cloneObject(data);
				if (newData.Tab?.customDelay?.list) {
					newData.Tab.customDelay.list.forEach(item => {
						if (!(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) {
							item.enable = true;
						}
					});
				}
				console.info("INFO(sequence): add enable property to data.tab.customdelay.list items", newData);
				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddLogLevelDefault",
			author     : "From E",
			authored   : "2026-02-01",
			version    : "1.20.0",
			description: {
				reason: "To add default values for the feature to control the log level (config.Debug.loglevel) in the debug console output, introduced in v1.20.0, if they do not exist.",
				target: "config.Debug.loglevel",
				action: "Add the default value `warn` if config.Debug.loglevel does not exist."
			}
		},
		spec: {
			lifecycle: { introduced: "1.20.0" }
		},
		order: 10,
		process: {
			condition: ({ data }) => !Object.hasOwn(data?.Debug ?? {}, "loglevel"),
			execute  : ({ data, context }) => {
				const newData = cloneObject(data);

				// Add property & apply default value
				if (context.Debug?.loglevel) {
					newData.Debug.loglevel = context.Debug.loglevel;
				}

				console.info("INFO(sequence): add data.debug.loglevel", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddMethodLabelDefault",
			author     : "From E",
			authored   : "2026-02-03",
			version    : "1.20.0",
			description: {
				reason: "To add default values for the feature to show/hide method labels (config.Debug.methodLabel) in the debug console output, introduced in v1.20.0, if they do not exist.",
				target: "config.Debug.methodLabel",
				action: "Add the default value `true` if config.Debug.methodLabel does not exist."
			}
		},
		spec: {
			lifecycle: { introduced: "1.20.0" }
		},
		order: 11,
		process: {
			condition: ({ data }) => !Object.hasOwn(data?.Debug ?? {}, "methodLabel"),
			execute  : ({ data, context }) => {
				const newData = cloneObject(data);

				// Add property & apply default value
				if (context.Debug?.methodLabel) {
					newData.Debug.methodLabel = context.Debug.methodLabel;
				}

				console.info("INFO(sequence): add data.debug.methodlabel", newData);

				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddCountPropertyToCustomDelay",
			author     : "From E",
			authored   : "2026-05-16",
			version    : "1.21.0",
			description: {
				reason: "To add the `count` property to each item in CustomDelay.list for the apply-count feature added in v1.21.0.",
				target: "config.Tab.customDelay.list[].count",
				action: "Add `count: TabOpenCustomDelayApplyFrom` (= 2) to each item if the property is missing."
			}
		},
		spec: {
			lifecycle: { introduced: "1.21.0" }
		},
		order: 12,
		process: {
			condition: ({ data }) => data.Tab?.customDelay?.list?.some(
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(item: any) => !Object.hasOwn(item, "count")
			) ?? false,
			execute: ({ data }) => {
				const newData = cloneObject(data);
				if (newData.Tab?.customDelay?.list) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					newData.Tab.customDelay.list.forEach((item: any) => {
						if (!Object.hasOwn(item, "count")) {
							item.count = define.TabOpenCustomDelayApplyFrom;
						}
					});
				}
				console.info("INFO(sequence): add count property to data.tab.customdelay.list items", newData);
				return newData;
			}
		}
	},
	{
		meta: {
			name       : "AddKeyBindingsDefault",
			author     : "From E",
			authored   : "2026-05-27",
			version    : "1.24.0",
			description: {
				reason: "To centralize keyboard shortcuts and trigger key assignments in the new KeyBindings section introduced in v1.24.0.",
				target: "config.KeyBindings",
				action: "Initialize KeyBindings with default values for PopupMenu actions."
			}
		},
		spec: {
			lifecycle: { introduced: "1.24.0" }
		},
		order: 13,
		process: {
			condition: ({ data }) => !Object.hasOwn(data, "KeyBindings"),
			execute  : ({ data, context }) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const newData = cloneObject(data) as any;

				// Add property & apply default value
				if (context.KeyBindings) {
					newData.KeyBindings = context.KeyBindings;
				}

				console.info("INFO(sequence): add data.keybindings", newData);

				return newData;
			}
		}
	}
];