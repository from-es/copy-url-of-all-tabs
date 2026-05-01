/**
 * Utility for comparing two configuration objects.
 *
 * @file
 * @lastModified 2026-04-08
 */

// Import NPM Package
import { isEqual } from "lodash-es";

// Import Types
import type { Config } from "@/assets/js/types";



/**
 * Represents an array of keys from the Config object.
 */
type KeyOfConfig = Array<keyof Config>;

/**
 * Result of the configuration comparison.
 */
type CompareResult = {
	/** Whether the two configurations are identical. */
	isEqual : boolean;
	/** Array of top-level keys that differed between the two objects. */
	diffKeys: KeyOfConfig;
};



/**
 * Compares top-level properties of two configuration objects and returns the difference information.
 * Uses `isEqual` from `lodash-es` for deep comparison of nested objects.
 *
 * @param   {Config}        oldConfig - Original configuration object.
 * @param   {Config}        newConfig - Normalized configuration object to compare against.
 * @returns {CompareResult}             Comparison result. If isEqual is false, it includes an array of top-level keys where differences were found.
 */
export function compareConfig(oldConfig: Config, newConfig: Config): CompareResult {
	if (isEqual(oldConfig, newConfig)) {
		return { isEqual: true, diffKeys: [] };
	}

	const diffKeys: KeyOfConfig = [];
	const keys                  = Object.keys(newConfig) as KeyOfConfig;

	for (const key of keys) {
		// Considered a difference if the key does not exist in oldConfig or if the values are different.
		if (!Object.prototype.hasOwnProperty.call(oldConfig, key) || !isEqual(oldConfig[key], newConfig[key])) {
			diffKeys.push(key);
		}
	}

	return { isEqual: diffKeys.length === 0, diffKeys };
}