/**
 * Returns the specific type of the given object as a lowercase string.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Returns the specific type of the given object as a lowercase string.
 *
 * Retrieves more detailed type information than the `typeof` operator (e.g., 'array', 'null', 'object').
 *
 * @param   {*}      obj - Any object or primitive value whose type is to be determined
 * @returns {string}       A lowercase string representing the type of the object
 *
 * @example
 * typeOf([]);   // 'array'
 * typeOf(null); // 'null'
 * typeOf({});   // 'object'
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function typeOf(obj: any): string {
	return (Object.prototype.toString).call(obj).slice(8, -1).toLowerCase();
}