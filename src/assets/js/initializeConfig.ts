/**
 * 設定を初期化、移行、検証するための主要なロジックを提供する。
 *
 * このファイルは、拡張機能の起動時や設定のインポート時などに呼び出され、
 * 以下の処理を行う責務を持つ。
 *   1. 設定のロード（ストレージまたは外部からの提供）
 *   2. 設定の初期化（デフォルト値の適用）
 *   3. 設定の移行（バージョン間の互換性維持）
 *   4. 設定の検証（不正な値の修正）
 *   5. 移行が成功した場合の設定の保存
 */

// Import Types
import  type { Config, Define, Status, EmptyObject } from "@/assets/js/types/";
import { type MigrationResult }                      from "@/assets/js/lib/user/MigrateConfig/types";

// Import Module
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
	#migrationStatus: MigrationResult | EmptyObject;

	/**
	 * @constructor
	 */
	constructor() {
		this.#migrationStatus = {};
	}

	/**
	 * 設定オブジェクトを受け取り、移行処理と検証プロセスを実行して、初期化された設定を返す
	 *
	 * @param   {Config} initialConfig - 初期設定オブジェクト
	 * @param   {Define} define        - 設定定義
	 * @returns {Promise<Config>}        初期化された設定
	 */
	async initialize(initialConfig: Config, define: Define): Promise<Config> {
		this.#resetMigrationStatus();

		const migrationResult = await this.#migrate(initialConfig, define);
		const verifiedConfig  = this.#verify(migrationResult.config, define);

		this.#migrationStatus = migrationResult;

		return verifiedConfig;
	}

	/**
	 * 設定の初期化処理で得られた移行ステータスを返す
	 *
	 * @returns {MigrationResult} 移行ステータス
	 */
	getMigrationStatus(): MigrationResult {
		return this.#migrationStatus as MigrationResult;
	}

	/**
	 * 移行ステータスをリセット
	 * @private
	 */
	#resetMigrationStatus() {
		this.#migrationStatus = {};
	}

	/**
	 * 設定の移行（マイグレーション）処理を実行
	 *
	 * 既存の設定オブジェクトと定義オブジェクトを基に、
	 * 定義された移行ルールを適用し、設定を最新の状態に更新する。
	 *
	 * @private
	 * @param   {Config}                   config - 移行対象の設定オブジェクト
	 * @param   {Define}                   define - 設定の定義オブジェクト
	 * @returns {Promise<MigrationResult>}        - 移行処理の結果を含むオブジェクト
	 */
	async #migrate(config: Config, define: Define): Promise<MigrationResult> {
		const migrationResult = migrateConfig(config, define);

		return migrationResult;
	}

	/**
	 * 設定値を検証し、不正な値や欠落している値を修正
	 *
	 * 設定オブジェクトと定義オブジェクトを基に、
	 * 各設定値の妥当性をチェックし、必要に応じてデフォルト値を適応する。
	 *
	 * @private
	 * @param   {Config} config - 検証対象の設定オブジェクト
	 * @param   {Define} define - 設定の定義オブジェクト
	 * @returns {Config}        - 検証および修正された設定オブジェクト
	 */
	#verify(config: Config, define: Define): Config {
		const verify = new VerifyConfigValue();

		return verify.verify(config, define);
	}
}

/**
 * @returns {Promise<Define>} - ブラウザ環境情報を追加した `Define` オブジェクト
 */
async function getInitDefine(): Promise<Define> {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();
	const _define    = cloneObject(define);

	_define.Environment.Browser = env;

	return _define;
}

/**
 * ロードまたは初期化された設定に対して、移行処理と検証処理を実行し、
 * 必要に応じてストレージに保存する。
 *
 * @param   {Config}          _config - ロードまたは初期化された設定オブジェクト
 * @param   {Define}          _define - 設定の定義オブジェクト
 * @param   {string}          keyname - ストレージに保存する際のキー名
 * @returns {Promise<Status>}         - 初期化された設定と define を含む Status オブジェクト
 */
async function processConfigInitialization(_config: Config, _define: Define, keyname: string): Promise<Status> {
	const configInitializer = new ConfigInitializer();

	const result = {
		config: await configInitializer.initialize(_config, _define),
		define: await getInitDefine()
	};

	// 移行処理を実行かつ、全ての移行処理がエラーなく完了している場合は、移行済み config を保存
	const migrationStatus = configInitializer.getMigrationStatus();
	if (migrationStatus.isSucceeded) {
		try {
			const item = { [keyname]: result.config };
			await StorageManager.save(item);
		} catch (error) {
			console.error("Failed to save migrated config to storage.", error);
		}
	}

	console.log("Config initialization. Migration Status:", { status: migrationStatus });

	return result;
}

/**
 * アプリケーションの設定を初期化するメイン関数
 *
 * @param   {Config | null}   config - 設定オブジェクト。null の場合はストレージから読み込む
 * @returns {Promise<Status>}        - 初期化された設定と define を含む Status オブジェクト
 */
export async function initializeConfig(config: Config | null): Promise<Status> {
	const keyname                = define.Storage.keyname;
	const _define                = cloneObject(define);
	let   _config: Config | null = null;

	// config が渡された値が、truthy な場合、暫定的に使用。そうでなければストレージからロード
	if (config) {
		_config = cloneObject(config);
	} else {
		try {
			const localStorageData = await StorageManager.load<{[key: string]: Config}>(keyname);
			_config = localStorageData?.[keyname] ?? _define.Config;
		} catch (error) {
			console.error("Failed to load config from storage. Using default config.", error);
			// ストレージからの設定読み込みに失敗した場合でも、デフォルト設定を適応し処理を続行
			_config = _define.Config;
		}
	}

	// _config が undefined or null or 空オブジェクトの場合は _define.Config で初期化し、ストレージに保存
	const isInValidConfig = !_config || typeof _config !== "object" || Object.keys(_config).length === 0;
	if (isInValidConfig) {
		_config = _define.Config;
		try {
			const item = { [keyname]: _config };
			await StorageManager.save(item);
		} catch (error) {
			console.error("Failed to save initial default config to storage.", error);
		}
	}

	const result = await processConfigInitialization(_config, _define, keyname);

	return result;
}