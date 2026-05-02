/**
 * Provides the main logic for initializing, migrating, and validating settings.
 *
 * This file is called when the extension starts or when settings are imported, and is responsible for the following processes:
 *   1. Loading settings (from storage or passed as an argument from outside)
 *   2. Initializing settings (applies default values if null is passed as an argument, on first startup, or if items are missing from settings)
 *   3. Migrating settings (maintaining compatibility between versions)
 *   4. Validating settings (correcting invalid values)
 *   5. Saving settings if migration was successful
 *
 * @file
 */

// Import Module
import { define }             from "@/assets/js/define";
import { MigrationManager }   from "@/assets/js/lib/MigrationManager";
import { migrationRules }     from "@/assets/js/lib/MigrationManager/rules";
import { cloneObject }        from "./lib/CloneObject";
import { StorageManager }     from "./lib/StorageManager";
import { VerifyConfigValue  } from "./lib/VerifyConfigValue";
import { BrowserEnvironment } from "./lib/BrowserEnvironment";

// Import Types
import type { Config, Define, Status, EmptyObject } from "@/assets/js/types";
import type { MigrationResult }                     from "@/assets/js/lib/MigrationManager/types";



/**
 * Class responsible for initializing, migrating, and validating settings
 */
class ConfigInitializer {
	#migrationStatus: MigrationResult<Config> | EmptyObject;

	constructor() {
		this.#migrationStatus = {};
	}

	/**
	 * Accepts a config object, executes the migration process and validation process, and returns the initialized config
	 *
	 * @param   {Config}          initialConfig - The initial configuration object
	 * @param   {Define}          define        - The settings definition
	 * @returns {Promise<Config>}                 The initialized configuration
	 */
	async initialize(initialConfig: Config, define: Define): Promise<Config> {
		this.#resetMigrationStatus();

		const migrationResult = await this.#migrate(initialConfig, define);
		this.#migrationStatus = migrationResult;

		// If isSucceeded is false, migrationResult.data is the old data.
		// Therefore, pass the original initialConfig for validation.
		const configToVerify = migrationResult.isSucceeded ? migrationResult.data : initialConfig;
		const verifiedConfig = this.#verify(configToVerify, define);

		return verifiedConfig;
	}

	/**
	 * Returns the migration status obtained during the configuration initialization process
	 *
	 * @returns {MigrationResult<Config>} The migration status
	 */
	getMigrationStatus(): MigrationResult<Config> {
		return this.#migrationStatus as MigrationResult<Config>;
	}

	/**
	 * Resets the migration status
	 *
	 * @returns {void}
	 */
	#resetMigrationStatus(): void {
		this.#migrationStatus = {};
	}

	/**
	 * Executes the configuration migration process
	 *
	 * Updates the configuration to the latest state by applying defined migration rules
	 * based on the existing configuration object and definition object.
	 *
	 * @param   {Config}                           config - The configuration object to undergo migration
	 * @param   {Define}                           define - The configuration definition object
	 * @returns {Promise<MigrationResult<Config>>}          An object containing the results of the migration process
	 */
	async #migrate(config: Config, define: Define): Promise<MigrationResult<Config>> {
		const manager         = new MigrationManager<Config>(migrationRules);
		const migrationResult = await manager.migrate(
			config,
			define.Config, // Pass define.Config as defaultValues
			{ failFast: false }
		);

		return migrationResult;
	}

	/**
	 * Validates configuration values and corrects invalid or missing values
	 *
	 * Checks the validity of each configuration value based on the configuration
	 * object and definition object, and applies default values as necessary.
	 *
	 * @param   {Config} config - The configuration object to be validated
	 * @param   {Define} define - The configuration definition object
	 * @returns {Config}          The validated and corrected configuration object
	 */
	#verify(config: Config, define: Define): Config {
		const verify = new VerifyConfigValue();
		return verify.verify(config, define);
	}
}

/**
 * Gets a `Define` object with browser environment information added.
 *
 * @returns {Promise<Define>} A `Define` object with browser environment information added
 */
async function getInitDefine(): Promise<Define> {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();
	const _define    = cloneObject(define);

	_define.Environment.Browser = env;

	return _define;
}

/**
 * Saves the configuration object to the browser's local storage
 *
 * @param   {Config}        config  - The configuration object to save
 * @param   {string}        keyname - The key name used for saving to storage
 * @returns {Promise<void>}
 */
async function saveConfig(config: Config, keyname: string): Promise<void> {
	try {
		const item = { [keyname]: config };

		await StorageManager.save(item);
	} catch (error) {
		console.error("ERROR(config): Failure: save config to storage", { error });
	}
}

/**
 * Executes migration and validation of the configuration
 *
 * @param   {Config} config - The configuration object to migrate and validate
 * @param   {Define} define - The configuration definition object
 * @returns {Promise<{ processedConfig: Config, migrationStatus: MigrationResult<Config> }>} An object containing the processed configuration and migration status
 */
async function processConfig(config: Config, define: Define): Promise<{ processedConfig: Config, migrationStatus: MigrationResult<Config> }> {
	const configInitializer = new ConfigInitializer();
	const processedConfig   = await configInitializer.initialize(config, define);
	const migrationStatus   = configInitializer.getMigrationStatus();

	console.info("INFO(config): Config processing finished", { status: migrationStatus });

	return { processedConfig, migrationStatus };
}

/**
 * Saves the processed configuration based on conditions
 *
 * @param   {Config}                  config          - The processed configuration object to save
 * @param   {MigrationResult<Config>} migrationStatus - Status of the migration process
 * @param   {string}                  keyname         - The key name used for saving to storage
 * @param   {boolean}                 save            - Whether to save the configuration to storage
 * @param   {boolean}                 isFirstInit     - Whether this is the first startup
 * @returns {Promise<void>}
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

	// Save if "migration succeeded" or "first startup"
	if (migrationStatus.isSucceeded || isFirstInit) {
		await saveConfig(config, keyname);
	}
}

/**
 * Oversees the processing (migration/validation) and saving of the configuration.
 *
 * If `initialConfig` is null, processing starts based on default settings.
 * Generates the final configuration object through migration and validation,
 * and saves it to storage depending on conditions (successful migration, first startup, etc.).
 *
 * @param   {Config | null}   initialConfig - The initial configuration object. If null, default settings are used
 * @param   {Define}          _define       - The configuration definition object
 * @param   {boolean}         save          - Whether to save the processed configuration to storage
 * @returns {Promise<Status>}                 A Status object containing the final configuration and define
 */
async function processAndSaveConfig(initialConfig: Config | null, _define: Define, save: boolean): Promise<Status> {
	const keyname = _define.Storage.keyname;

	// If `initialConfig` is falsy (null or undefined), it's considered to be
	// either the first startup or a failure in loading from local storage.
	const isFirstInit = !initialConfig;

	// If `initialConfig` is not provided (`falsy`), use default settings.
	// Otherwise, use the provided `initialConfig` for processing.
	const configToProcess = initialConfig ?? _define.Config;

	// Migration and Validation
	const { processedConfig, migrationStatus } = await processConfig(configToProcess, _define);

	// Save configuration to local storage
	await saveProcessedConfig(processedConfig, migrationStatus, keyname, save, isFirstInit);

	// Return the final Status object
	return {
		config: processedConfig,
		define: await getInitDefine()
	};
}

/**
 * Main function to initialize application configuration
 *
 * Performs loading, initialization, migration, and validation of settings,
 * with an option to save to storage (enabled by default).
 *
 * @param   {Config | null}   config      - Configuration object. If null, it is loaded from storage
 * @param   {boolean}         [save=true] - Whether to save to storage if migration or initialization occurred
 * @returns {Promise<Status>}               A Status object containing initialized configuration and define
 */
async function initializeConfig(config: Config | null, save: boolean = true): Promise<Status> {
	const _define                    = cloneObject(define);
	let  loadedConfig: Config | null = config ? cloneObject(config) : null;

	// If null is passed as the config argument, load from storage
	if (!loadedConfig) {
		try {
			const storageData = await StorageManager.load<{ [key: string]: Config }>(_define.Storage.keyname);
			const keyname     = _define.Storage.keyname;

			if (storageData && Object.hasOwn(storageData, keyname)) {
				loadedConfig = storageData[keyname];
			}
		} catch (error) {
			console.error("ERROR(config): Failure: load config from storage, proceeding with default", { error });
		}
	}

	// Execute subsequent processing based on settings loaded from local storage or null
	return await processAndSaveConfig(loadedConfig, _define, save);
}



export { initializeConfig };