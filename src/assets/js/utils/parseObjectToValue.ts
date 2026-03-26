/**
 * Converts an object to a JSON string and parses it back to JSON, removing reactive proxies and returning a pure value object.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Converts an object to a JSON string and parses it back to JSON, removing reactive proxies and returning a pure value object.
 *
 * Can also be used to create a deep copy of an object.
 *
 * @remarks
 * Note the following limitations:
 *   - Functions, Symbols, and undefined are removed during serialization
 *   - Date objects are converted to ISO strings, and remain strings upon deserialization
 *   - Objects containing circular references cannot be processed and will throw an exception
 *
 * If a more complete deep copy is required, it is recommended to use the standard API `structuredClone()` or Lodash's `cloneDeep()`.
 *
 * @template T         The type of the object to convert
 * @param    {T} obj - The object to be converted into a pure value
 * @returns  {T}       A pure value object with proxies removed
 */
export function parseObjectToValue<T>(obj: T): T {
	return JSON.parse(JSON.stringify(obj));
}