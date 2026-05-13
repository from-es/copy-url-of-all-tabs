<script lang="ts">
	/**
	 * Import / Export section component for the options page.
	 *
	 * @file
	 */

	// Import Svelte Object
	import { shareStatus as status } from "@/assets/js/app/initializeSharedState.svelte.ts";

	// Import NPM Package
	import dayjs from "dayjs";

	// Import Module
	import { cloneObject }                    from "@/assets/js/lib/CloneObject";
	import { ConfigManager, MIME_TO_EXT_MAP } from "@/assets/js/lib/ConfigManager";
	import { PopoverMessage }                 from "@/assets/js/lib/MessageManager/PopoverMessage";
	import { StorageManager }                 from "@/assets/js/lib/StorageManager";
	import { initializeConfig }               from "@/assets/js/app/initializeConfig";
	import { reInitialize }                   from "../lib/utils/settingsHelper";

	// Import Types
	import type { Config, Status }         from "@/assets/js/types";
	import type { MimeType, ExportResult } from "@/assets/js/lib/ConfigManager";



	/**
	 * Click event for the Import Settings button. Reads settings from a JSON file.
	 *
	 * @returns {Promise<void>}
	 */
	async function eventImportConfig(): Promise<void> {
		await importConfig(status, "application/json");
	}

	/**
	 * Click event for the Export Settings button. Exports current settings to a JSON file.
	 *
	 * @returns {Promise<void>}
	 */
	async function eventExportConfig(): Promise<void> {
		await exportConfig(status, "application/json", "YYYY-MM-DD_HH-mm-ss");
	}

	/**
	 * Imports a configuration file, updates the application's state, and displays a status message.
	 *
	 * @param   {Status} currentStatus - The current status object of the application, containing config and define.
	 * @param   {string} mimetype      - The expected MIME type of the file to import.
	 * @returns {Promise<void>}
	 */
	async function importConfig(currentStatus: Status, mimetype: MimeType): Promise<void> {
		const result = await ConfigManager.importFile(mimetype);
		let   message;

		// Terminate without a message if the user cancels.
		if (result.isUserCancel) {
			return;
		}

		// On successful file read
		if (result.success && typeof result.content === "string") {
			try {
				// Parse and initialize the configuration
				/*
				  Notes:
				    Disable automatic saving of settings during import to maintain consistency
				    with the user documentation's specification that "settings are not saved
				    until the Save button is pressed."
				*/
				const _config    = JSON.parse(result.content);
				const save       = false;
				const { config } = await initializeConfig(_config, save);

				// Update status and perform post-processing
				/*
				  Note:
				    Since objects are passed by reference in JavaScript, the `currentStatus`
				    parameter holds a reference to the original `status` object (the bindable prop).
				    Therefore, assigning a new value to `currentStatus.config` directly modifies
				    the `status` prop, updating the component's state.
				*/
				currentStatus.config = config;
				reInitialize(status);

				message = currentStatus.define.Message.Setting_ImportConfig_Success;
			} catch (error) {
				const err      = error as Error;
				const template = currentStatus.define.Message.Setting_ImportConfig_Error;

				message = cloneObject(template);
				message.message.push(`Failed to process configuration: ${err.message}`);

				console.error("ERROR(config): Failure: load configuration, parsing or initialization failed", { error });

				// Add supplementary message if JSON.parse fails (SyntaxError)
				if (err instanceof SyntaxError) {
					const errorMessages = [
						"The file may be corrupted or the character encoding may not be UTF-8.",
						"Please check the file format and encoding."
					];
					message.message.push(...errorMessages);
				}
			}
		} else {
			// On file read failure
			const template = currentStatus.define.Message.Setting_ImportConfig_Error;

			message = cloneObject(template);
			message.message.push(result.message);
		}

		PopoverMessage.create(message);
	}

	/**
	 * Exports the current application config to a JSON file and initiates a download.
	 * This function now explicitly loads saved config from storage and will fail if it
	 * cannot be retrieved, preventing the accidental export of unsaved UI config.
	 *
	 * @param   {Status}        currentStatus - The current status object of the application, containing config and define.
	 * @param   {string}        mimetype      - The MIME type for the exported file.
	 * @param   {string}        timeFormat    - The `dayjs` format string to use for the timestamp in the filename.
	 * @returns {Promise<void>}
	 */
	async function exportConfig(currentStatus: Status, mimetype: MimeType, timeFormat: string): Promise<void> {
		const define = currentStatus.define;

		/**
		 * Loads config from storage. Throws an error if config does not exist.
		 *
		 * @returns {Promise<Config>} The loaded config object.
		 * @throws  {Error}           If loading fails or config is not found.
		 */
		const getSetting = async (): Promise<Config> => {
			const keyname = define.Storage.keyname;
			const data    = await StorageManager.load<{ [key: string]: Config }>(keyname);

			// StorageManager.load returns null on I/O errors
			if (data === null) {
				// The details of the error have already been logged to the console by StorageManager.load
				throw new Error("Failure: an error occurred while loading config from storage in exportConfig.getSetting");
			}

			const setting = data?.[keyname];

			// Config not found in storage
			if (!setting) {
				console.warn("WARN(storage): Failure: load configuration from storage for export");

				throw new Error("Failure: could not find saved config in exportConfig.getSetting");
			}

			// Successfully retrieved
			return setting;
		};

		/**
		 * Generates a filename for the export.
		 *
		 * @returns {string} The generated filename.
		 */
		const getFileName = (): string => {
			const getFilenameExtension = (): string => {
				const extensions     = MIME_TO_EXT_MAP[mimetype];
				const firstCandidate = extensions?.[0];
				const extension      = firstCandidate ?? "txt";
				const result         = extension.replace(/^\./, "");

				if (!firstCandidate) {
					console.warn("WARN(config): export configuration: no extension found for mimetype, defaulting to txt", { mimetype, availableMimeTypes: MIME_TO_EXT_MAP });
				}

				return result;
			};

			const appName    = define.Information.name.replace(/\s/g, "-");
			const appVersion = define.Information.version;
			const datestr    = dayjs().format(timeFormat);

			return `${appName}_v${appVersion}_${datestr}.${getFilenameExtension()}`;
		};

		/**
		 * Aggregates the series of processes from data acquisition to export execution.
		 *
		 * @returns {Promise<ExportResult>}
		 */
		const performExport = async (): Promise<ExportResult> => {
			const setting  = await getSetting();
			const filename = getFileName();
			const content  = JSON.stringify(setting, null, "\t");

			return ConfigManager.exportFile(content, filename, mimetype);

		};

		let message;

		try {
			// Execute data processing.
			const result = await performExport();

			// Prepare UI message based on the result.
			const template = result.success ? define.Message.Setting_ExportConfig_Success : define.Message.Setting_ExportConfig_Error;
			message = cloneObject(template);

			if (!result.success) {
				message.message.push(result.message);
			}
		} catch (error) {
			// Prepare UI message for errors.
			const err      = error as Error;
			const template = define.Message.Setting_ExportConfig_Error;

			message = cloneObject(template);
			message.message.push(`Failed to export configuration: ${err.message}`);

			console.error("ERROR(config): Failure: configuration export failed", { error: err });
		}

		PopoverMessage.create(message);
	}
</script>



<article id="config">
	<h1>Import &#47; Export</h1>

	<section>
		<button id="Config-import" title="Import Settings" onclick={ eventImportConfig }>Import</button>
		<button id="Config-export" title="Export Settings" onclick={ eventExportConfig }>Export</button>
	</section>
</article>