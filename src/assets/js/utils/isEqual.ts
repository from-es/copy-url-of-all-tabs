/**
 * Performs a deep equality check between two values.
 *
 * @file
 * @lastModified 2026-03-30
 *
 * @dependency typeOf
 */

// Import Module
import { typeOf } from "./typeOf";



/**
 * Performs a deep equality check between two values.
 *
 * Recursively compares the properties of two values. Returns true if both values
 * are deeply equal (primitives, objects, or arrays).
 *
 * @param   {unknown} objA - The first value to compare
 * @param   {unknown} objB - The second value to compare
 * @returns {boolean}        true if the values are deeply equal
 */
export function isEqual(objA: unknown, objB: unknown): boolean {
	// 1. Strict Equality (handles same reference and primitives)
	if (objA === objB) {
		return true;
	}

	// 2. NaN check (as NaN !== NaN)
	if (typeof objA === "number" && typeof objB === "number" && isNaN(objA) && isNaN(objB)) {
		return true;
	}

	const typeA = typeOf(objA);
	const typeB = typeOf(objB);

	// 3. Type mismatch
	if (typeA !== typeB) {
		return false;
	}

	// 4. Recursive comparison for Objects
	if (typeA === "object") {
		const a     = objA as Record<string, unknown>;
		const b     = objB as Record<string, unknown>;
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if (keysA.length !== keysB.length) {
			return false;
		}

		return keysA.every(key =>
			Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key])
		);
	}

	// 5. Recursive comparison for Arrays
	if (typeA === "array") {
		const a = objA as unknown[];
		const b = objB as unknown[];

		if (a.length !== b.length) {
			return false;
		}

		return a.every((item: unknown, index: number) => isEqual(item, b[index]));
	}

	// For other built-in types (null, undefined, Date etc.),
	// they were already handled by step 1 or 3.
	return false;
}