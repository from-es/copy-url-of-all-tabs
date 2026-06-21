/**
 * Sequence rule definitions for data correction before saving.
 *
 * @file
 * @lastModified 2026-06-20
 */

// Import Module
import { cloneObject } from "@/assets/js/lib/CloneObject";

// Import Types
import type { Config }       from "@/assets/js/types";
import type { SequenceRule } from "@/assets/js/lib/SequenceProcessor/types";

/**
 * An array that defines the configuration sequence rules.
 * Each rule encapsulates the conditions and execution logic for applying specific configuration changes.
 *
 * @see {@link ../../../../../lib/SequenceProcessor/doc/SequenceRule.ja.md}
 */
export const rules: SequenceRule<Config, Partial<Config>>[] = [
	{
		meta: {
			name       : "RemoveEmptyCustomDelayPattern",
			author     : "From E",
			authored   : "2025-12-05",
			version    : "1.14.0",
			description: {
				reason: "To prevent unnecessary warnings during configuration saving validation when the `pattern` property of objects in the `config.Tab.customDelay.list` array contains an empty string or a whitespace-only string.",
				target: "config.Tab.customDelay.list",
				action: "Remove objects from `config.Tab.customDelay.list` where the `pattern` property is an empty or whitespace-only string."
			}
		},
		spec: {
			lifecycle: { introduced: "1.14.0" }
		},
		order: 1,
		process: {
			condition: ({ data }) => Object.hasOwn(data?.Tab?.customDelay ?? {}, "list") && Array.isArray(data.Tab.customDelay.list) && (data.Tab.customDelay.list).length > 0,
			execute  : ({ data }) => {
				const newData = cloneObject(data);

				newData.Tab.customDelay.list = (newData.Tab.customDelay.list).filter(
					(obj) => {
						const str = (obj.pattern).replace(/^(\s+)$/g, "");

						return (str.length > 0) ? true : false;
					}
				);

				console.debug("DEBUG(sequence): presave corrections: config.tab.customdelay.list", { before: data, after: newData });

				return newData;
			}
		}
	}
];