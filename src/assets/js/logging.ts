// Import Types
import { type Config, type Define } from "@/assets/js/define";

// Import from Script
import { ConsoleManager } from "@/assets/js/lib/user/ConsoleManager";

/**
 * デバッグロギングの有効/無効を切り替える
 * ConsoleManagerを使用し、設定に基づいてコンソール出力の有効/無効を切り替え
 *
 * @param   {Config} config
 * @param   {Define} define
 * @returns {void}
 * @see ConsoleManager
 */
export function logging(config: Config, define: Define): void {
	const validConfig = (config && typeof config === "object" && Object.hasOwn(config, "Debug"));
	const doLogging   = (validConfig && typeof config.Debug === "boolean") ? config.Debug : define.Config.Debug;

	// config
	if (!validConfig) {
		// debug
		console.error("Error, Invalid value passed to logging(config, define). { config, define } >>", { config, define });
	}

	ConsoleManager.option(doLogging);
	ConsoleManager.apply();
}