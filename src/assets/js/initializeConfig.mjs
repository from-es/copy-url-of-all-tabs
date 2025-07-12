// Import from Script
import { define             } from "@/assets/js/define.mjs";
import { migrateConfig      } from "./migrateConfig.js";
import { cloneObject        } from "./lib/user/CloneObject.mjs";
import { StorageManager     } from "./lib/user/StorageManager.mjs";
import { VerifyConfigValue  } from "./lib/user/VerifyConfigValue.mjs";
import { BrowserEnvironment } from "./lib/user/BrowserEnvironment.mjs";



/**
 * config & define オブジェクトの初期化・検証
 * @param   {object | null} config - config
 * @returns {object}               - { config, define }
 */
async function initializeConfig(config = null) {
	return {
		config: await getInitConfig(config),
		define: await getInitDefine()
	};
}

async function getInitConfig(config) {
	// Get Local Storage Data
	const keyname = "config";
	const _define = cloneObject(define);

	// Todo: config >> 要、型確認 >> Verify Config で検証しているから不要？@2025/07/11
	// config !== null の時は取り敢えず config オブジェクトして扱う、config === null の時はストレージ領域から読み込む
	config = config ? config : await StorageManager.load(keyname);

	// Check Variable of Config
	if ( config === undefined || config === null || typeof config !== "object" || Object.keys(config).length === 0 ) {
		config = _define.Config;

		await StorageManager.save(keyname, config);
	}

	// Migrate Config
	config = migrateConfig(config, _define);

	// Verify Config
	const verify = new VerifyConfigValue();
	config = verify.verify(config, _define);

	return config;
};

async function getInitDefine() {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();

	// Set Browser Environment Information
	define.Environment.Browser = env;

	return define;
}



export { initializeConfig };