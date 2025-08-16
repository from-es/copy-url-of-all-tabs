/**
 * class ConsoleManager を通してログ出力の有無を設定
 *
 * @dependency   ConsoleManager.mjs
 * @lastModified 2025-08-12
 */
import { ConsoleManager } from "../ConsoleManager.mjs";

function logging(config, define) {
	const validConfig = ( config && typeof config === "object" && Object.hasOwn(config, "Debug") );
	const logging     = validConfig ? config.Debug : define.Config.Debug;

	// config
	if ( !validConfig ) {
		// debug
		console.log("Error, logging(), Invalid Argument Value was passed. config >>", config);
	}

	ConsoleManager.option(logging);
	ConsoleManager.apply();
}

export { logging };