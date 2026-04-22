/**
 * Removes duplicate elements from an array.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Validates the arguments to ensure early detection of incorrect utility usage.
 *
 * @remarks
 * The parameter is typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param  {unknown}   list         - The value to validate as an array
 * @param  {string}    functionName - The name of the function calling the validation (for error messages)
 * @throws {TypeError}                If the argument is not an array
 */
function validateArguments(list: unknown): void {
	if (!Array.isArray(list)) {
		console.debug("DEBUG(util): Invalid: expected an array as argument", { list });
		throw new TypeError(`Invalid: expected an array as argument, but received ${typeof list}`);
	}
}

/**
 * Removes duplicate elements from an array.
 *
 * This function works optimally for arrays of primitive values, but can also be used for arrays containing object references.
 *
 * @template T            The type of elements in the array
 * @param    {T[]} list - The original array to remove duplicates from
 * @returns  {T[]}        A new array with duplicates removed
 * @throws   {TypeError}  Thrown if the argument is not an array
 */
function toUniqueArray<T>(list: T[]): T[] {
	validateArguments(list);

	return Array.from(new Set(list));
}

/**
 * Validates whether the provided array consists only of allowed primitive types (string, number, bigint, symbol).
 *
 * Throws an error if the argument is not an array, contains elements of an unallowed type, or if the types are mixed.
 *
 * @remarks
 * The parameter is typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param   {unknown}    list - The array to validate
 * @returns {void}
 * @throws  {TypeError}         If validation fails
 */
function validatePrimitiveArray(list: unknown): void {
	validateArguments(list);

	// At this point, list is guaranteed to be an array
	const array = list as unknown[];

	// Allow empty arrays
	if (array.length === 0) {
		return;
	}

	// Check if any type other than allowed primitives (string, number, bigint, symbol) is passed
	const firstElementType  = typeof array[0];
	const reg_PrimitiveType = /string|number|bigint|symbol/i;
	const isPrimitiveType   = (reg_PrimitiveType).test(firstElementType);
	if (!isPrimitiveType) {
		console.debug("DEBUG(util): Invalid: expected array element type (string, number, bigint, symbol)", { type: firstElementType });
		throw new TypeError(`Invalid: expected array element type (string, number, bigint, symbol), but received ${firstElementType}`);
	}

	// Check if all array elements are of the same type
	const isAllSameType = array.every((elm) => typeof elm === firstElementType);
	if (!isAllSameType) {
		console.debug("DEBUG(util): Invalid: all elements in array must be of the same type", { list: array });
		throw new TypeError("Invalid: all elements in array must be of the same type");
	}
}



export {
	toUniqueArray,
	validatePrimitiveArray
};