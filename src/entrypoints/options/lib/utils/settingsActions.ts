/**
 * Action functions for settings (Save, Reset).
 *
 * @file
 */

// Import Module
import { cloneObject }                 from "@/assets/js/lib/CloneObject";
import { StorageManager }              from "@/assets/js/lib/StorageManager";
import { PopoverMessage }              from "@/assets/js/lib/MessageManager/PopoverMessage";
import { initializeConfig }            from "@/assets/js/app/initializeConfig";
import { rules as PreSaveCorrections } from "@/assets/js/app/MigrationManager/rules/patch/preSaveCorrections";
import { compareConfig }               from "./configComparer";
import { applyPreSaveCorrections, getInformationOfConfig, reInitialize, disableElementTemporarily } from "./settingsHelper";

// Import Types
import type { Status } from "@/assets/js/types";



/**
 * Click event for the Save Settings button. Validates input values and saves to storage if no issues are found.
 *
 * @param   {Status} status - Application state object.
 * @returns {Promise<void>}
 */
async function eventSettingSave(status: Status): Promise<void> {
	try {
		const currentStatus               = cloneObject(status);
		const currentConfig               = await applyPreSaveCorrections(currentStatus.config, currentStatus.define, PreSaveCorrections); // Apply minor corrections as pre-processing before saving settings
		const { config: validatedConfig } = await initializeConfig(currentConfig, false);   // Gets validated and normalized settings (for validation purposes, does not save to storage)
		const { isEqual, diffKeys }       = compareConfig(currentConfig, validatedConfig);  // Checks for differences before and after validation (differences indicate invalid input)

		/*
			If no differences:
				Update `config.Information` and save settings
			If differences:
				Determine that invalid input occurred, and notify the user of the affected settings. Do not save settings.
		*/
		if (isEqual) {
			// Update Information of Config
			currentConfig.Information = getInformationOfConfig();

			// Save to Local Storage
			const keyname = status.define.Storage.keyname;
			const item    = { [keyname]: currentConfig };
			await StorageManager.save(item);

			// Re-initialize UI and sync status.config with currentConfig (which may contain auto-corrections)
			status.config = currentConfig;
			reInitialize(status);

			PopoverMessage.create(status.define.Message.Setting_OnClick_SaveButton_Success);
			console.info("INFO(storage): Success: save configuration", { config: currentConfig });
		} else {
			// Convert object keys with differences to display names
			const displayNames = diffKeys.map(key => {
				const displayNameMap = status.define.ConfigPropertyDisplayNames as Record<string, string | undefined>;
				return displayNameMap[String(key)] ?? String(key);
			}).join(", ");

			const message = cloneObject(status.define.Message.Setting_AutoCorrect);
			message.message.push(displayNames);

			// Notify user of the settings where differences occurred
			PopoverMessage.create(message);

			console.warn("WARN(config): save cancelled, invalid values auto-corrected", { correctedKeys: diffKeys });
		}
	} catch (error) {
		const message = cloneObject(status.define.Message.Setting_UnexpectedError);

		if (error instanceof Error && error?.message) {
			message.message.push(error.message);
		}

		// Add error message
		PopoverMessage.create(message);

		console.error("ERROR(storage): Exception: unexpected error during save process", { error });
	}
}

/**
 * Click event for the Reset Settings button. Resets all settings to their initial values.
 *
 * @param   {Status}        status  - Application state object.
 * @param   {HTMLElement}   element - The button element that was clicked.
 * @returns {Promise<void>}
 */
async function eventSettingReset(status: Status, element: HTMLElement): Promise<void> {
	// Measure to prevent repeated button clicks
	disableElementTemporarily(element, status.define.DisabledTimeoutValue);

	status.config = cloneObject(status.define.Config);

	// Update config.Information with current values to prevent validation warnings on save.
	status.config.Information = getInformationOfConfig();

	// Re-initialize
	reInitialize(status);

	// Show UI message
	PopoverMessage.create(status.define.Message.Setting_OnClick_ResetButton);

	console.info("INFO(config): Success: reset configuration", { config: status.config });
}



export {
	eventSettingSave,
	eventSettingReset
};