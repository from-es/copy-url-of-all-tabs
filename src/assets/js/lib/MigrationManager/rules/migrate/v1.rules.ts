/**
 * Migration rule definitions for the v1 series of settings.
 *
 * @file
 * @author       From E
 * @lastModified 2026-04-18
 */

// Import Module
import { cloneObject }     from "@/assets/js/lib/CloneObject";
import { compareVersions } from "@/assets/js/utils/CompareVersions";

// Import Types
import type { Config }        from "@/assets/js/types";
import type { MigrationRule } from "@/assets/js/lib/MigrationManager/types";



/**
 * An array that defines the configuration migration rules.
 * Each rule encapsulates the conditions and execution logic for applying specific configuration changes.
 * For details on how to define rules, refer to MigrationRule.md.
 *
 * @see {@link ../../doc/MigrationRule.md}
 */
export const rules: MigrationRule<Config>[] = [
	{
		meta: {
			author  : "From E",
			reason  : "To maintain backward compatibility after renaming properties following the addition of Copy & Paste settings (allowing URL filtering to be applied individually to each) in the v0.7.0 update.",
			target  : "config.Filtering.enable",
			action  : "Copy the value of config.Filtering.enable to new config.Filtering.Copy.enable and config.Filtering.Paste.enable properties, then delete config.Filtering.enable.",
			authored: "2025-01-29",
			version : {
				introduced: "0.7.0",
				obsoleted : null
			}
		},
		order: 1,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data?.Filtering, "enable");
		},
		execute: (argument) => {
			const { data } = argument;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newData = cloneObject(data) as any;

			// Migration
			newData.Filtering.Copy  = { enable: true };                      // Set default value
			newData.Filtering.Paste = { enable: newData.Filtering.enable };  // Copy previous value for compatibility

			// Delete
			delete newData.Filtering.enable;

			console.info("INFO(migration): migrate config of value: change data.filtering.enable to data.filtering.copy.enable and data.filtering.paste.enable", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "Typo in the property name config.Format.mimetype as config.Format.minetype.",
			target  : "config.Format.minetype",
			action  : "Fix the property name from minetype to mimetype, copy the value of minetype, and then delete minetype.",
			authored: "2025-07-11",
			version : {
				introduced: "1.0.0",
				obsoleted : null
			}
		},
		order: 2,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data.Format, "minetype");
		},
		execute: (argument) => {
			const { data } = argument;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newData = cloneObject(data) as any;

			// Migration
			newData.Format.mimetype = newData.Format.minetype;

			// Delete
			delete newData.Format.minetype;

			console.info("INFO(migration): migrate config of value: change data.format.minetype to data.format.mimetype", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add default values for the feature to delay individual tabs (Tab.customDelay) introduced in v1.0.0 if they do not exist.",
			target  : "config.Tab.customDelay",
			action  : "Add default values if config.Tab.customDelay does not exist.",
			authored: "2025-08-01",
			version : {
				introduced: "1.0.0",
				obsoleted : null
			}
		},
		order: 3,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Tab, "customDelay");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// Add property & apply default value
			if (defaultValues.Tab?.customDelay) {
				newData.Tab.customDelay = defaultValues.Tab.customDelay;
			}

			console.info("INFO(migration): add data.tab.customdelay", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "The value managed in config.Information.date.unixtime is actually 'UNIX epoch * 1000', which does not match the property name. Therefore, renaming it to config.Information.date.timestamp.",
			target  : "config.Information.date.unixtime",
			action  : "Copy the value of the unixtime property to timestamp, then delete the unixtime property.",
			authored: "2025-10-04",
			version : {
				introduced: "1.4.0",
				obsoleted : null
			}
		},
		order: 4,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data.Information.date, "unixtime");
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			// Migration
			const infoDate = newData.Information.date as unknown as Record<string, unknown>;
			newData.Information.date.timestamp = infoDate["unixtime"] as number;

			// Delete
			delete infoDate["unixtime"];

			console.info("INFO(migration): migrate config of value: change data.information.date.unixtime to data.information.date.timestamp", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To remove unnecessary `url` properties caused by data structure inconsistencies when adding custom delay settings between v1.0.0 and v1.4.0, due to an implementation bug on the options page.",
			target  : "config.Information.version, config.Tab.customDelay.list[].url",
			action  : "Delete the `url` property if the configuration version is v1.4.0 or earlier and the custom delay list contains it.",
			authored: "2025-10-07",
			version : {
				introduced: "1.5.0",
				obsoleted : null
			}
		},
		order: 5,
		condition: (argument) => {
			const { data } = argument;

			const isSameOrEarlier = (base: unknown, target: unknown) => {
				const comp = compareVersions(base, target);

				return comp === 0 || comp === -1;
			};

			let   isTargetVersion = false;
			const base            = "1.4.0";
			let   target          = null;
			try {
				// Check if the version when settings were saved is v1.4.0 or earlier
				target = data.Information?.version ?? "1.0.0";  // Get version at save time. If not present, apply first release version.

				isTargetVersion = isSameOrEarlier(base, target);
			} catch (error) {
				console.error("ERROR(migration): migration rule error: failed to compare versions for custom delay rule", {
					"Migration Rule": "Remove the `url` property from the custom delay setting added between v1.0.0 and v1.4.0",
					baseVersion     : base,
					targetVersion   : target,
					originalError   : error
				});
			}

			// Check if any object in the customDelay.list array has a 'url' property
			const hasUrlPropertyInList = data.Tab?.customDelay?.list?.some(item => Object.hasOwn(item, "url")) ?? false;

			return isTargetVersion && hasUrlPropertyInList;
		},
		execute: (argument) => {
			const { data } = argument;
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

			console.info("INFO(migration): migrate config of value: remove data.tab.customdelay.list.url property", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add default values for the feature to control tab expansion behavior (Tab.TaskControl) introduced in v1.7.0 if they do not exist.",
			target  : "config.Tab.TaskControl",
			action  : "Add default values if config.Tab.TaskControl does not exist.",
			authored: "2025-10-18",
			version : {
				introduced: "1.8.0",
				obsoleted : null
			}
		},
		order: 6,
		condition: (argument) => {
			const { data } = argument;
			return !Object.hasOwn(data?.Tab, "TaskControl");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// Add property & apply default value
			if (defaultValues.Tab?.TaskControl) {
				newData.Tab.TaskControl = defaultValues.Tab.TaskControl;
			}

			console.info("INFO(migration): add data.tab.taskcontrol", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To handle the structural change of `config.Filtering` following the addition of URL deduplication settings in v1.11.0.",
			target  : "config.Filtering",
			action  : "Restructure Filtering settings into the new structure (Deduplicate and Protocol) and initialize Deduplicate settings.",
			authored: "2025-11-01",
			version : {
				introduced: "1.12.0",
				obsoleted : null
			}
		},
		order: 7,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Filtering, "Deduplicate");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const newData = cloneObject(data) as any;

			// Get values from source (undefined if not present)
			const oldCopyEnable  = newData.Filtering?.Copy?.enable;
			const oldPasteEnable = newData.Filtering?.Paste?.enable;
			const oldProtocol    = newData.Filtering?.Protocol;

			// Create new structure by deep copying from defaultValues
			if (defaultValues.Filtering) {
				newData.Filtering = cloneObject(defaultValues.Filtering);
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

			console.info("INFO(migration): migrate config of value: restructure data.filtering", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add default values for the badge feature (Badge) that displays the 'number of pending URLs' on the extension icon, introduced in v1.12.0, if they do not exist.",
			target: "config.Badge",
			action  : "If config.Badge does not exist, add the property and apply default values.",
			authored: "2025-11-10",
			version : {
				introduced: "1.12.0",
				obsoleted : null
			}
		},
		order: 8,
		condition: (argument) => {
			const { data } = argument;
			return !Object.hasOwn(data, "Badge");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// Add property & apply default value
			if (defaultValues.Badge) {
				newData.Badge = defaultValues.Badge;
			}

			console.info("INFO(migration): add data.badge", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add an enable/disable flag to each item in CustomDelay in v1.18.0.",
			target  : "config.Tab.customDelay.list[].enable",
			action  : "Add `enable: true` to each item in config.Tab.customDelay.list if the property is missing.",
			authored: "2026-01-16",
			version : {
				introduced: "1.18.0",
				obsoleted : null
			}
		},
		order: 9,
		condition: (argument) => {
			const { data }      = argument;
			const configVersion = data.Information?.version ?? "0.0.0";

			try {
				// Not a migration target if configVersion is not less than "1.18.0"
				if (compareVersions("1.18.0", configVersion) !== -1) {
					return false;
				}
			} catch (error) {
				console.error("ERROR(migration): migration rule error: failed to compare versions for custom delay enable property rule",
					{
						"Migration Rule": "Add enable property to each item in config.Tab.customDelay.list",
						baseVersion     : "1.18.0",
						targetVersion   : configVersion,
						originalError   : error
					}
				);

				return false;
			}

			// Target for migration if `customDelay.list` exists as an array and contains at least one item that does not have a boolean `enable` property (countermeasure against invalid overwrites)
			return data.Tab?.customDelay?.list?.some(item => !(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) ?? false;
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			if (newData.Tab?.customDelay?.list) {
				newData.Tab.customDelay.list.forEach(item => {
					// Set default value `true` for items that do not have a boolean `enable` property
					if (!(Object.hasOwn(item, "enable") && typeof item.enable === "boolean")) {
						item.enable = true;
					}
				});
			}

			console.info("INFO(migration): add enable property to data.tab.customdelay.list items", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add default values for the feature to control the log level (config.Debug.loglevel) in the debug console output, introduced in v1.20.0, if they do not exist.",
			target  : "config.Debug.loglevel",
			action  : "Add the default value `warn` if config.Debug.loglevel does not exist.",
			authored: "2026-02-01",
			version : {
				introduced: "1.20.0",
				obsoleted : null
			}
		},
		order: 10,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Debug, "loglevel");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData                 = cloneObject(data);

			// Add property & apply default value
			if (defaultValues.Debug?.loglevel) {
				newData.Debug.loglevel = defaultValues.Debug.loglevel;
			}

			console.info("INFO(migration): add data.debug.loglevel", newData);

			return newData;
		}
	},
	{
		meta: {
			author  : "From E",
			reason  : "To add default values for the feature to show/hide method labels (config.Debug.methodLabel) in the debug console output, introduced in v1.20.0, if they do not exist.",
			target  : "config.Debug.methodLabel",
			action  : "Add the default value `true` if config.Debug.methodLabel does not exist.",
			authored: "2026-02-03",
			version : {
				introduced: "1.20.0",
				obsoleted : null
			}
		},
		order: 11,
		condition: (argument) => {
			const { data } = argument;

			return !Object.hasOwn(data?.Debug, "methodLabel");
		},
		execute: (argument) => {
			const { data, defaultValues } = argument;
			const newData = cloneObject(data);

			// Add property & apply default value
			if (defaultValues.Debug?.methodLabel) {
				newData.Debug.methodLabel = defaultValues.Debug.methodLabel;
			}

			console.info("INFO(migration): add data.debug.methodlabel", newData);

			return newData;
		}
	}
];