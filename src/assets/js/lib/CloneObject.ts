/**
 * Utility for deep cloning objects.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import NPM Package
import cloneDeep from "lodash-es/cloneDeep";



/**
 * Deep clones an object.
 *
 * Attempts deep cloning using `structuredClone()` preferentially.
 * If the object contains non-serializable values not supported by `structuredClone()` such as functions or DOM nodes,
 * or if a `DataCloneError` occurs, it falls back to `lodash-es/cloneDeep` which supports a wider range of data types.
 *
 * @template T       - The type of the object to clone.
 * @param    {T} obj - The object to clone.
 * @returns  {T}       The deep-cloned new object.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/structuredClone
 * @see https://lodash.com/docs/#cloneDeep
 */
export function cloneObject<T>(obj: T): T {
	// Use `cloneDeep()` directly if `structuredClone()` is not available in the environment.
	if (typeof structuredClone !== "function") {
		// console.debug("DEBUG(util): structuredClone is not available, using cloneDeep directly", { obj });
		return cloneDeep(obj);
	}

	try {
		return structuredClone(obj);
	} catch (error: unknown) {
		// Check if the error is a `DataCloneError` when `structuredClone()` fails.
		if (error instanceof DOMException && error.name === "DataCloneError") {
			// console.debug("DEBUG(util): structuredClone failed, falling back to cloneDeep", { obj });
			return cloneDeep(obj);
		}

		// Re-throw if the error is not a `DataCloneError`, as it is an unexpected error.
		console.error("ERROR(util): Exception: unexpected error occurred during object cloning", { error, obj });
		throw new Error("Exception: unexpected error occurred during object cloning", { cause: error });
	}
}