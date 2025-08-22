// Import Types
import { type Config, type Define } from "@/assets/js/types/";

// Import from Script
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
	#config : Config | null = null;
	#define : Define | null = null;

	constructor() {
		// nothing
	}

	/**
	 * 設定の初期化プロセスを実行します
	 */
	public async initialize(initialConfig: Config, define: Define): Promise<Config> {
		// initialize() 呼び出しのタイミンクで初期化 >> インスタント再利用時の混入対策
		this.#config = initialConfig;
		this.#define = define;

		await this.#migrate();
		this.#verify();

		return this.#config;
	}

	/**
	 * 設定の移行（マイグレーション）を実行
	 */
	async #migrate(): Promise<void> {
		const migrationResult = migrateConfig(this.#config, this.#define);

		this.#config = migrationResult.config;
	}

	/**
	 * 設定値を検証し、不正な値を修正
	 */
	#verify(): void {
		const verify = new VerifyConfigValue();

		this.#config = verify.verify(this.#config, this.#define);
	}
}



/**
 * config & define オブジェクトの初期化・検証
 */
async function initializeConfig(config: Config | null): Promise<{ config: Config; define: Define; }> {
	const keyname = define.Storage.keyname;
	const _define = cloneObject(define);
	let   _config: Config | undefined;

	// config !== null の場合は config オブジェクトして扱う、config === null の時はストレージから取得
	if ( config ) {
		_config = cloneObject(config);
	} else {
		const localStorageData = await StorageManager.load<{[key: string]: Config}>(keyname);
		_config = localStorageData?.[keyname];
	}

	// Check Variable of Config >> 初回起動用チェック
	if ( _config === undefined || _config === null || typeof _config !== "object" || Object.keys(_config).length === 0 ) {
		_config = _define.Config;

		const item = { [keyname]: _config };
		await StorageManager.save(item);
	}

	const initializer = new ConfigInitializer();

	return {
		config: await initializer.initialize(_config, _define),
		define: await getInitDefine()
	};
}

async function getInitDefine(): Promise<Define> {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();
	const _define    = cloneObject(define);

	_define.Environment.Browser = env;

	return _define;
}



export { initializeConfig };