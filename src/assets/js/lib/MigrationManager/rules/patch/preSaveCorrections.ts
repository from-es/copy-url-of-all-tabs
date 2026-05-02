/**
 * Rule definitions for data correction before saving.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import Module
import { cloneObject } from "@/assets/js/lib/CloneObject";

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
			reason  : "To prevent unnecessary warnings during configuration saving validation when the `pattern` property of objects in the `config.Tab.customDelay.list` array contains an empty string or a whitespace-only string.",
			target  : "config.Tab.customDelay.list",
			action  : "Remove objects from `config.Tab.customDelay.list` where the `pattern` property is an empty or whitespace-only string.",
			authored: "2025-12-05",
			version : {
				introduced: "1.14.0",
				obsoleted : null
			}
		},
		order: 1,
		condition: (argument) => {
			const { data } = argument;

			return Object.hasOwn(data?.Tab?.customDelay, "list") && Array.isArray(data.Tab.customDelay.list) && (data.Tab.customDelay.list).length > 0;
		},
		execute: (argument) => {
			const { data } = argument;
			const newData  = cloneObject(data);

			newData.Tab.customDelay.list = (newData.Tab.customDelay.list).filter(
				(obj) => {
					const str = (obj.pattern).replace(/^(\s+)$/g, "");

					return (str.length > 0) ? true : false;
				}
			);

			console.debug("DEBUG(migration): presave corrections: config.tab.customdelay.list", { before: data, after: newData });

			return newData;
		}
	}
];