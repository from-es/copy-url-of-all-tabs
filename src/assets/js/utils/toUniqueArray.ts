/**
 * Removes duplicate elements from an array.
 *
 * @file
 * @lastModified 2026-03-24
 */

type AllowedPrimitive = string | number | bigint | symbol;



/**
 * Removes duplicate elements from an array.
 *
 * This function works optimally for arrays of primitive values, but can also be used for arrays containing object references.
 *
 * @template T            The type of elements in the array
 * @param    {T[]} list - The original array to remove duplicates from
 * @returns  {T[]}        A new array with duplicates removed
 */
function toUniqueArray<T>(list: T[]): T[] {
	if (!Array.isArray(list)) {
		// For compatibility, throw an error if not an array
		throw new Error(`Invalid: expected an array as argument, but received ${typeof list} in toUniqueArray`);
	}

	return Array.from(new Set(list));
}

/**
 * Validates whether the provided array consists only of allowed primitive types (string, number, bigint, symbol).
 *
 * Throws an error if the argument is not an array, contains elements of an unallowed type, or if the types are mixed.
 *
 * @template T              The type of elements in the array (AllowedPrimitive)
 * @param    {T[]}   list - The array to validate
 * @returns  {void}
 * @throws   {Error}        If validation fails
 */
function validatePrimitiveArray<T extends AllowedPrimitive>(list: T[]): void {
	if (!Array.isArray(list)) {
		throw new Error(`Invalid: expected an array as argument, but received ${typeof list} in validatePrimitiveArray`);
	}

	// Allow empty arrays
	if (list.length === 0) {
		return;
	}

	// Check if any type other than allowed primitives (string, number, bigint, symbol) is passed
	const firstElementType  = typeof list[0];
	const reg_PrimitiveType = /string|number|bigint|symbol/i;
	const isPrimitiveType   = (reg_PrimitiveType).test(firstElementType);
	if (!isPrimitiveType) {
		throw new Error(`Invalid: expected array element type (string, number, bigint, symbol), but received ${firstElementType} in validatePrimitiveArray`);
	}

	// Check if all array elements are of the same type
	const isAllSameType = list.every((elm) => typeof elm === firstElementType);
	if (!isAllSameType) {
		throw new Error("Invalid: all elements in array must be of the same type in validatePrimitiveArray");
	}
}



export {
	toUniqueArray,
	validatePrimitiveArray
};