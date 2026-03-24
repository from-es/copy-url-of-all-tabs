/**
 * Utility for logging
 *
 * @file
 */

// Import Module
import { ConsoleManager } from "@/assets/js/lib/user/ConsoleManager";

// Import Types
import type { Config, Define } from "@/assets/js/define";



/**
 * Enables or disables debug logging
 *
 * Uses ConsoleManager to enable/disable console output based on settings
 *
 * @param   {Config} config - User configuration object
 * @param   {Define} define - Predefined constant object
 * @returns {void}
 *
 * @see ConsoleManager
 */
function logging(config: Config, define: Define): void {
	const isValidConfig  = validConfig(config, define);
	const loggingOptions = isValidConfig ? config.Debug : define.Config.Debug;

	// config
	if (!isValidConfig) {
		console.error("ERROR(config): invalid value passed to logging", { config, define });
	}

	ConsoleManager.option(loggingOptions);
	ConsoleManager.apply();
}

/**
 * Validates the effectiveness of the config.Debug object based on rules in define.Verification
 *
 * @param   {Config}  config - The config object to validate
 * @param   {Define}  define - The define object containing validation rules
 * @returns {boolean}          true if config.Debug is valid, false otherwise
 */
function validConfig(config: Config, define: Define): boolean {
	// Basic check for existence and type of config.Debug
	if (!config?.Debug || typeof config.Debug !== "object") {
		return false;
	}

	// Extract rules starting with "Debug."
	const debugRules = getRulesByPrefix(define.Verification, "Debug.");

	// If no rules extracted, validation is not possible, so return false
	if (debugRules.length === 0) {
		console.warn("WARN(config): no verification rules found for debug in define.verification");
		return false;
	}

	// Apply all rules; return false if even one fails
	return debugRules.every(verificationRule => {
		// Extract "logging" from "Debug.logging"
		const propName = verificationRule.property.substring("Debug.".length);

		// Check if property exists in config.Debug
		if (!Object.hasOwn(config.Debug, propName)) {
			return false;
		}

		// Get actual value from config.Debug object
		const value = config.Debug[propName as keyof Config["Debug"]];

		// Execute v8n rule
		return verificationRule.rule(value);
	});
}

/**
 * Extracts rules matching the specified property prefix from an array of objects having a `property` key
 *
 * @template T
 * @param    {T[]}    rules  - Array containing objects that satisfy { property: string }
 * @param    {string} prefix - The property prefix to search for (e.g., "Debug.")
 * @returns  {T[]}             Filtered array of objects
 */
function getRulesByPrefix<T extends { property: string }>(rules: T[], prefix: string): T[] {
	return rules.filter(rule => rule.property.startsWith(prefix));
}



export { logging };