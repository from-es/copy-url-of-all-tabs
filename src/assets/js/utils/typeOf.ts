/**
 * Returns the specific type of the given value as a lowercase string.
 *
 * @file
 * @lastModified 2026-03-30
 */

/**
 * Returns the specific type of the given value as a lowercase string.
 *
 * Retrieves more detailed type information than the `typeof` operator (e.g., 'array', 'null', 'object').
 *
 * @param   {unknown} value - Any value whose type is to be determined
 * @returns {string}          A lowercase string representing the type of the value
 *
 * @example
 * typeOf([]);   // 'array'
 * typeOf(null); // 'null'
 * typeOf({});   // 'object'
 */
export function typeOf(value: unknown): string {
	return (Object.prototype.toString).call(value).slice(8, -1).toLowerCase();
}