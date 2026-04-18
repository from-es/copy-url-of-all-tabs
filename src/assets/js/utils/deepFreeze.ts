/**
 * Recursively freezes an object and all its nested properties, making it immutable.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Recursively freezes an object and all its nested properties, making it immutable.
 *
 * @template T                   The type of the object to freeze
 * @param    {T}           obj - The object to freeze
 * @returns  {Readonly<T>}       The object with all its properties made read-only
 * @throws   {TypeError}         Thrown if the argument is not a non-null object
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
	if (obj === null || typeof obj !== "object") {
		throw new TypeError("Invalid: argument 'obj' must be a non-null object");
	}

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