/**
 * Utility for logging
 *
 * @file
 * @lastModified 2026-04-08
 *
 * @dependency isEqual
 */

// Import Module
import { ConsoleManager } from "@/assets/js/lib/ConsoleManager";
import { isEqual }        from "@/assets/js/utils/isEqual";

// Import Types
import type { Config, Define } from "@/assets/js/types";



/**
 * Enables or disables debug logging based on settings.
 *
 * @param   {Config} config - User configuration object
 * @param   {Define} define - Predefined constant object
 * @returns {void}
 */
function logging(config: Config, define: Define): void {
	const loggingOptions = (config?.Debug && typeof config.Debug === "object") ? config.Debug : define.Config.Debug;

	// Optimization: Skip re-applying if options haven't changed
	const { option: current } = ConsoleManager.state();
	const isSame              = isEqual(current, loggingOptions);

	if (isSame) {
		return;
	}

	// Helper to apply logging configuration to ConsoleManager
	const applyLoggingConfig = (options: typeof loggingOptions): void => {
		ConsoleManager.option(options);
		ConsoleManager.apply();
	};

	try {
		applyLoggingConfig(loggingOptions);
	} catch (error) {
		// Log error and fallback to default if application fails
		console.error("ERROR(config): Invalid value passed to logging, falling back to defaults", { error, config });
		applyLoggingConfig(define.Config.Debug);
	}
}



export { logging };