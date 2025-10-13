// Import Types
import { type Config, type Define, type Status } from "@/assets/js/types/";

// Import Script
import { define }             from "@/assets/js/define";
import { migrateConfig }      from "./lib/user/MigrateConfig";
import { cloneObject }        from "./lib/user/CloneObject";
import { StorageManager }     from "./lib/user/StorageManager";
import { VerifyConfigValue  } from "./lib/user/VerifyConfigValue";
import { BrowserEnvironment } from "./lib/user/BrowserEnvironment";



/**
 * 設定の初期化、移行、検証を行う責務を持つクラス
 */
class ConfigInitializer {
	/**
	 * 設定の初期化プロセスを実行
	 */
	public static async initialize(initialConfig: Config, define: Define): Promise<Config> {
		const config         = await ConfigInitializer.#migrate(initialConfig, define);
		const verifiedConfig = ConfigInitializer.#verify(config, define);

		return verifiedConfig;
	}

	/**
	 * 設定の移行（マイグレーション）を実行
	 */
	static async #migrate(config: Config, define: Define): Promise<Config> {
		const migrationResult = migrateConfig(config, define);

		return migrationResult.config;
	}

	/**
	 * 設定値を検証し、不正な値を修正
	 */
	static #verify(config: Config, define: Define): Config {
		const verify = new VerifyConfigValue();

		return verify.verify(config, define);
	}
}

async function getInitDefine(): Promise<Define> {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();
	const _define    = cloneObject(define);

	_define.Environment.Browser = env;

	return _define;
}

/**
 * config & define オブジェクトの初期化・検証
 */
async function initializeConfig(config: Config | null): Promise<Status> {
	const keyname                = define.Storage.keyname;
	const _define                = cloneObject(define);
	let   _config: Config | null = null;

	// config が渡された場合はそれを使用、そうでなければストレージからロード
	if (config) {
		_config = cloneObject(config);
	} else {
		const localStorageData = await StorageManager.load<{[key: string]: Config}>(keyname);
		_config = localStorageData?.[keyname] ?? _define.Config;
	}

	// _config が undefined or null or 空オブジェクトの場合は _define.Config で初期化し、保存
	if (!_config || typeof _config !== "object" || Object.keys(_config).length === 0) {
		_config = _define.Config;
		const item = { [keyname]: _config };
		await StorageManager.save(item);
	}

	return {
		config: await ConfigInitializer.initialize(_config, _define),
		define: await getInitDefine()
	};
}



export { initializeConfig };