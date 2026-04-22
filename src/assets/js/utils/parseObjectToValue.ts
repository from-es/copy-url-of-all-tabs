/**
 * Converts an object to a JSON string and parses it back to JSON, removing reactive proxies and returning a pure value object.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Converts an object to a JSON string and parses it back to JSON, removing reactive proxies and returning a pure value object.
 *
 * Can also be used to create a deep copy of an object.
 *
 * @deprecated This function is deprecated and will be removed in a future version.
 * Use the standard API `structuredClone()` or the project's internal library `src/assets/js/lib/user/CloneObject.ts` instead.
 *
 * @remarks
 * Note the following limitations:
 *   - Functions, Symbols, and undefined are removed during serialization
 *   - Date objects are converted to ISO strings, and remain strings upon deserialization
 *   - Objects containing circular references cannot be processed and will throw an exception
 *
 * @template T             The type of the object to convert
 * @param    {T} obj     - The object to be converted into a pure value
 * @returns  {T}           A pure value object with proxies removed
 * @throws   {TypeError}   Thrown if the argument is not a non-null object
 */
export function parseObjectToValue<T>(obj: T): T {
	if (obj === null || typeof obj !== "object") {
		throw new TypeError("Invalid: argument 'obj' must be a non-null object");
	}

	return JSON.parse(JSON.stringify(obj));
}