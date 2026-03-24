/**
 * Detects duplicate IDs within an array of objects and replaces duplicates with newly generated unique IDs.
 *
 * @file
 * @lastModified 2026-03-24
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
 *
 * @param   {CodeObject[]} array - An array of objects with an ID property
 * @returns {CodeObject[]}         A new array where duplicate IDs have been replaced by unique ones
 */
export function parseArrayOfCodeIntoUniqueID(array: CodeObject[]): CodeObject[] {
	const codes       = structuredClone(array);
	const flatArray   = codes.map(elm => elm.id);
	const isDuplicate = (flatArray.length !== (new Set(flatArray)).size); // Duplicate detection

	if (!isDuplicate) {
		return codes;
	}

	(flatArray).forEach(
		(element, index) => {
			const match = flatArray.filter(elm => elm === element);

			if (match.length > 1) {
				const id = generateID(32);

				console.debug("DEBUG(string): duplicate id found, generating new unique id", { index, match });

				flatArray[index]  = id;
				(codes[index]).id = id;
			}
		}
	);

	return codes;
}