/**
 * Functions for managing custom tab opening delay settings.
 *
 * @file
 * @lastModified 2026-03-24
 */

// Import Module
import { define } from "@/assets/js/define";

// Import Types
import type { CustomDelayInfo } from "@/assets/js/define/types";



/**
 * Adds a new row to the custom delay settings list.
 *
 * @param   {CustomDelayInfo[]} list - Array of custom delay information to be edited.
 * @returns {void}
 */
function addRowForCustomDelay(list: CustomDelayInfo[]): void {
	(list).push({
		id     : crypto.randomUUID(), // Always assign a unique ID to the new row.
		enable : true,                // Enabled by default when newly created.
		pattern: "",
		delay  : define.TabOpenCustomDelayValue,
	});
}

/**
 * Deletes the custom delay setting row with the specified ID from the list.
 *
 * @param   {CustomDelayInfo[]} list       - Array of custom delay information to be edited.
 * @param   {string}            idToDelete - The ID of the row to delete.
 * @returns {void}
 */
function deleteRowForCustomDelay(list: CustomDelayInfo[], idToDelete: string): void {
	const indexToDelete = list.findIndex(item => item.id === idToDelete);

	if ( indexToDelete > -1 ) {
		list.splice(indexToDelete, 1);
	}
}



export {
	addRowForCustomDelay,
	deleteRowForCustomDelay
};