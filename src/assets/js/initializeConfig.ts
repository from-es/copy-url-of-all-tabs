/**
 * 設定を初期化、移行、検証するための主要なロジックを提供する。
 *
 * このファイルは、拡張機能の起動時や設定のインポート時などに呼び出され、
 * 以下の処理を行う責務を持つ。
 *   1. 設定のロード（ストレージまたは外部から引数として渡される）
 *   2. 設定の初期化（引数に null が渡された場合、初回起動時、または設定に項目が不足している場合は、デフォルト値適用）
 *   3. 設定の移行（バージョン間の互換性維持）
 *   4. 設定の検証（不正な値の修正）
 *   5. 移行が成功した場合の設定の保存
 */

// Import Types
import type { Config, Define, Status, EmptyObject } from "@/assets/js/types/";
import type { MigrationResult }                     from "@/assets/js/lib/user/MigrationManager/types";

// Import Module
import { define }             from "@/assets/js/define";
import { MigrationManager }   from "@/assets/js/lib/user/MigrationManager";
import { migrationRules }     from "@/assets/js/lib/user/MigrationManager/rules";
import { cloneObject }        from "./lib/user/CloneObject";
import { StorageManager }     from "./lib/user/StorageManager";
import { VerifyConfigValue  } from "./lib/user/VerifyConfigValue";
import { BrowserEnvironment } from "./lib/user/BrowserEnvironment";

/**
 * 設定の初期化、移行、検証を行う責務を持つクラス
 */
class ConfigInitializer {
	#migrationStatus: MigrationResult<Config> | EmptyObject;

	/**
	 * @constructor
	 */
	constructor() {
		this.#migrationStatus = {};
	}

	/**
	 * 設定オブジェクトを受け取り、移行処理と検証プロセスを実行して、初期化された設定を返す
	 *
	 * @param   {Config}          initialConfig - 初期設定オブジェクト
	 * @param   {Define}          define        - 設定定義
	 * @returns {Promise<Config>}               - 初期化された設定
	 */
	async initialize(initialConfig: Config, define: Define): Promise<Config> {
		this.#resetMigrationStatus();

		const migrationResult = await this.#migrate(initialConfig, define);
		this.#migrationStatus = migrationResult;

		// isSucceeded が false の場合、migrationResult.data は古いデータ。
		// そのため、検証に渡すのは元の initialConfig とする。
		const configToVerify = migrationResult.isSucceeded ? migrationResult.data : initialConfig;
		const verifiedConfig = this.#verify(configToVerify, define);

		return verifiedConfig;
	}

	/**
	 * 設定の初期化処理で得られた移行ステータスを返す
	 *
	 * @returns {MigrationResult<Config>} - 移行ステータス
	 */
	getMigrationStatus(): MigrationResult<Config> {
		return this.#migrationStatus as MigrationResult<Config>;
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
	 * @param   {Config}                           config - 移行対象の設定オブジェクト
	 * @param   {Define}                           define - 設定の定義オブジェクト
	 * @returns {Promise<MigrationResult<Config>>}        - 移行処理の結果を含むオブジェクト
	 */
	async #migrate(config: Config, define: Define): Promise<MigrationResult<Config>> {
		const manager         = new MigrationManager<Config>(migrationRules);
		const migrationResult = await manager.migrate(
			config,
			define.Config, // defaultValues として define.Config を渡す
			{ failFast: false }
		);

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
 * 設定オブジェクトをブラウザのローカルストレージに保存する
 *
 * @private
 * @param   {Config} config  - 保存する設定オブジェクト
 * @param   {string} keyname - ストレージに保存する際のキー名
 */
async function saveConfig(config: Config, keyname: string): Promise<void> {
	try {
		const item = { [keyname]: config };

		await StorageManager.save(item);
	} catch (error) {
		console.error("[Initialize Config] Failed to save config to storage.", error);
	}
}

/**
 * 設定の移行と検証を実行する
 *
 * @private
 * @param   {Config} config - 移行・検証する設定オブジェクト
 * @param   {Define} define - 設定の定義オブジェクト
 * @returns {Promise<{ processedConfig: Config, migrationStatus: MigrationResult<Config> }>} - 処理済みの設定と移行ステータスを含むオブジェクト
 */
async function processConfig(config: Config, define: Define): Promise<{ processedConfig: Config, migrationStatus: MigrationResult<Config> }> {
	const configInitializer = new ConfigInitializer();
	const processedConfig   = await configInitializer.initialize(config, define);
	const migrationStatus   = configInitializer.getMigrationStatus();

	console.info("[Initialize Config] Config processing finished. Migration Status:", { status: migrationStatus });

	return { processedConfig, migrationStatus };
}

/**
 * 処理済みの設定を、条件に応じて保存する
 *
 * @private
 * @param   {Config}                  config          - 保存する処理済み設定オブジェクト
 * @param   {MigrationResult<Config>} migrationStatus - 移行処理のステータス
 * @param   {string}                  keyname         - ストレージに保存する際のキー名
 * @param   {boolean}                 save            - 設定をストレージに保存するかどうか
 * @param   {boolean}                 isFirstInit     - 初回起動かどうか
 */
async function saveProcessedConfig(
	config         : Config,
	migrationStatus: MigrationResult<Config>,
	keyname        : string,
	save           : boolean,
	isFirstInit    : boolean
): Promise<void> {
	if (!save) {
		return;
	}

	// 「移行が成功した」または「初回起動」の場合に保存
	if (migrationStatus.isSucceeded || isFirstInit) {
		await saveConfig(config, keyname);
	}
}

/**
 * 設定の処理（移行・検証）と保存を統括する。
 *
 * `initialConfig` が null の場合はデフォルト設定を元に処理を開始する。
 * 移行や検証を経て、最終的な設定オブジェクトを生成し、
 * 条件（移行成功時、初回起動時など）に応じてストレージに保存する。
 *
 * @private
 * @param   {Config | null}   initialConfig - 初期設定オブジェクト。null の場合はデフォルト設定が使用される
 * @param   {Define}          _define       - 設定の定義オブジェクト
 * @param   {boolean}         save          - 処理後の設定をストレージに保存するかどうか
 * @returns {Promise<Status>}               - 最終的な設定と define を含む Status オブジェクト
 */
async function processAndSaveConfig(initialConfig: Config | null, _define: Define, save: boolean): Promise<Status> {
	const keyname = _define.Storage.keyname;

	// `initialConfig` が falsy な場合（null または undefined）、
	// 初回起動時、もしくはローカルストレージからの読み込みに失敗したと見なす。
	const isFirstInit = !initialConfig;

	// `initialConfig` が提供されていない（`falsy`）場合はデフォルト設定を使用し、
	// そうでなければ提供された `initialConfig` を処理対象とする。
	const configToProcess = initialConfig ?? _define.Config;

	// 移行と検証
	const { processedConfig, migrationStatus } = await processConfig(configToProcess, _define);

	// 設定をローカルストレージに保存
	await saveProcessedConfig(processedConfig, migrationStatus, keyname, save, isFirstInit);

	// 最終的な Status オブジェクトを返す
	return {
		config: processedConfig,
		define: await getInitDefine()
	};
}

/**
 * アプリケーションの設定を初期化するメイン関数
 *
 * 設定のロード、初期化、移行、検証を行い、オプションでストレージへの保存（デフォルト有効）を行う。
 *
 * @param   {Config | null}   config      - 設定オブジェクト。null の場合はストレージから読み込む
 * @param   {boolean}         [save=true] - 移行や初期化が行われた場合に設定をストレージに保存するかどうか
 * @returns {Promise<Status>}             - 初期化された設定と define を含む Status オブジェクト
 */
export async function initializeConfig(config: Config | null, save: boolean = true): Promise<Status> {
	const _define                    = cloneObject(define);
	let  loadedConfig: Config | null = config ? cloneObject(config) : null;

	// 引数 config に null が渡された場合、ストレージから読み込む
	if (!loadedConfig) {
		try {
			const storageData = await StorageManager.load<{ [key: string]: Config }>(_define.Storage.keyname);
			const keyname     = _define.Storage.keyname;

			if (storageData && Object.hasOwn(storageData, keyname)) {
				loadedConfig = storageData[keyname];
			}
		} catch (error) {
			console.error("[Initialize Config] Failed to load config from storage. Proceeding with default config.", error);
		}
	}

	// ローカルストレージから読み込んだ設定 or null を元に、後続処理を実行
	return await processAndSaveConfig(loadedConfig, _define, save);
}