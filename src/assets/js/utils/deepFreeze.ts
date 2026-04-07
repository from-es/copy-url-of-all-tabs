/**
 * Recursively freezes an object and all its nested properties, making it immutable.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Recursively freezes an object and all its nested properties, making it immutable.
 *
 * @template T                   The type of the object to freeze
 * @param    {T}           obj - The object to freeze
 * @returns  {Readonly<T>}       The object with all its properties made read-only
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
	// Get property names defined on the object
	const propNames = Object.getOwnPropertyNames(obj);

	// Freeze properties before freezing the object itself
	for (const name of propNames) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const value = (obj as any)[name];

		if (value && typeof value === "object") {
			deepFreeze(value);
		}
	}

	return Object.freeze(obj);
}