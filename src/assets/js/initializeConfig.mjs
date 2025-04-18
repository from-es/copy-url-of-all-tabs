// Import NPM Package
import cloneDeep from "lodash-es/cloneDeep.js";

// Import from Script
import { StorageManager     } from "./lib/user/StorageManager.mjs";
import { VerifyConfigValue  } from "./lib/user/VerifyConfigValue.mjs";
import { BrowserEnvironment } from "./lib/user/BrowserEnvironment.mjs";



export async function initializeConfig(define) {
	// Get Local Storage Data
	const keyname = "config";
	let   config  = await StorageManager.load(keyname);
	const _define = cloneDeep(define);

	// Check Variable of Config
	if ( config === undefined || config === null || typeof config !== "object" || Object.keys(config).length === 0 ) {
		config = _define.Config;

		await StorageManager.save(keyname, config);
	}

	// Migrate Config
	config = migrateConfig(config);

	// Verify Config Value
	const verify = new VerifyConfigValue();
	config = verify.verify(config, _define);

	// Get Browser Environment Information
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();
	define.Environment.Browser = env;

	return config;
}

function migrateConfig(_config) {
	const config = cloneDeep(_config);

	// Patch, from "0.6.1" or "0.6.1.1" to "0.7.z.a" or later
	if ( Object.hasOwn(config.Filtering, "enable") ) {
		config.Filtering = {
			Copy :  {
				enable : true
			},
			Paste : {
				enable : config.Filtering.enable
			}
		};

		delete config.Filtering.enable;
	}

	return config;
}