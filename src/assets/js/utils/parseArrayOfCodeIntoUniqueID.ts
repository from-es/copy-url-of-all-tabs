/**
 * Detects duplicate IDs within an array of objects and replaces duplicates with newly generated unique IDs.
 *
 * @file
 * @lastModified 2026-04-18
 */

// Import Module
import { generateID } from "./generateID";



interface CodeObject {
	id: string;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;  // Fallback if properties of the passed array of objects were other than "id"
}



/**
 * Detects duplicate IDs within an array of objects and replaces duplicates with newly generated unique IDs.
 * Optimized to O(N) complexity using a Map to track ID occurrences.
 *
 * @param   {CodeObject[]} array - An array of objects with an ID property
 * @returns {CodeObject[]}         A new array where duplicate IDs have been replaced by unique ones
 * @throws  {TypeError}            Thrown if the argument is not an array
 */
export function parseArrayOfCodeIntoUniqueID(array: CodeObject[]): CodeObject[] {
	if (!Array.isArray(array)) {
		throw new TypeError("Invalid: argument 'array' must be an array");
	}

	const codes = structuredClone(array);

	// Count occurrences of each ID - O(N)
	const idCounts = new Map<string, number>();
	for (const item of codes) {
		idCounts.set(item.id, (idCounts.get(item.id) || 0) + 1);
	}

	// Early return if no duplicate IDs are found - O(N)
	if (idCounts.size === codes.length) {
		return codes;
	}

	// Track all IDs currently in use to avoid collisions with generated IDs - O(N)
	const usedIds = new Set(idCounts.keys());

	// Iterate through the array and replace duplicates with new unique IDs - O(N)
	for (const item of codes) {
		const currentId = item.id;

		if (idCounts.get(currentId)! > 1) {
			// Generate a new unique ID and ensure it doesn't collide with any existing ID
			let newId: string;
			do {
				newId = generateID(32);
			} while (usedIds.has(newId));

			// Update the object and tracking state
			item.id = newId;
			usedIds.add(newId);
			idCounts.set(currentId, idCounts.get(currentId)! - 1); // Decrease the count for the original ID

			console.debug("DEBUG(string): duplicate id found, generated new unique id", { originalId: currentId, newId });
		}
	}

	return codes;
}