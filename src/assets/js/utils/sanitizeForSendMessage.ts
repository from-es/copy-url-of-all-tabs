/**
 * Sanitizes an object to be safely sent as a message.
 *
 * @file
 * @lastModified 2026-04-18
 */

interface SanitizeOptions {
	checkOnly?: boolean;
	debug    ?: boolean;
}



/**
 * Sanitizes an object to be safely sent as a message.
 *
 * It attempts to structuredClone the object internally and removes non-serializable properties upon failure.
 *
 * @template T                    The type of the data to be sanitized
 * @param    {T}      data      - The data to be sanitized.
 * @param    {object} [options] - If true, performs only validation of whether the data is structured-cloneable, without sanitizing. Throws an error if it's not cloneable.
 * @returns  {T}                  The sanitized data. Also returns the original data if validation succeeds with checkOnly=true.
 * @throws   {Error}              If the data is not structured-cloneable when checkOnly is true, or if an unexpected error occurs during sanitization.
 */
function sanitizeForSendMessage<T>(data: T, options: SanitizeOptions = { checkOnly: false, debug: false }): T {
	const { checkOnly, debug } = options;

	try {
		// If structuredClone succeeds, the data is safe to be sent via sendMessage.
		structuredClone(data);

		return data;
	} catch (error) {
		const err = error as Error;

		// DataCloneError occurs if the object contains non-cloneable properties.
		// eslint-disable-next-line quotes
		if (err.name === 'DataCloneError') {
			if (checkOnly) {
				// If only checking, throw an error to notify.
				console.debug("DEBUG(messaging): Invalid: data contains properties that cannot be structured cloned", { data, error });
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				throw new Error("Invalid: data contains properties that cannot be structured cloned", { cause: error, data } as any);
			}

			// Execute sanitization.
			if (debug) {
				console.debug("DEBUG(util): removeNonCloneableProperties: message contains non-cloneable data, sanitizing", { original: data });
			}
			return removeNonCloneableProperties(data, debug ?? false);
		}
		// Re-throw any unexpected errors other than DataCloneError.
		console.debug("DEBUG(messaging): Exception: an unexpected error occurred during the sanitization process", { data, error });
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		throw new Error("Exception: an unexpected error occurred during the sanitization process", { cause: error, data } as any);
	}
}

/**
 * Recursively traverses an object or array and returns a new object with properties that cannot be structured-cloned (e.g., functions, symbols, DOM nodes) removed.
 * (Used as a fallback for sanitizeForSendMessage)
 *
 * @param   {unknown} obj   - The target object or array.
 * @param   {boolean} debug - If true, outputs debug logs.
 * @returns {any}             A new object or array with non-cloneable properties removed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function removeNonCloneableProperties(obj: unknown, debug: boolean): any {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => removeNonCloneableProperties(item, debug));
	}

	const newObj: Record<string, unknown> = {};
	const targetObj                       = obj as Record<string, unknown>;

	for (const key in targetObj) {
		if (Object.prototype.hasOwnProperty.call(targetObj, key)) {
			const value = targetObj[key];
			const type  = typeof value;

			// Exclude functions, symbols, and DOM nodes as they cannot be structured-cloned.
			if (type === "function" || type === "symbol" || (typeof Node !== "undefined" && value instanceof Node)) {
				if (debug) {
					console.debug("DEBUG(util): removeNonCloneableProperties: exclude non-cloneable data types", { key, value });
				}

				continue;
			}

			newObj[key] = removeNonCloneableProperties(value, debug);
		}
	}
	return newObj;
}



export { sanitizeForSendMessage };