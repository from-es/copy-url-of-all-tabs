// Type Definition
interface SanitizeOptions {
	checkOnly?: boolean;
	debug?    : boolean;
}

/**
 * Sanitizes an object to be safely sent as a message.
 * It attempts to structuredClone the object internally and removes non-serializable properties upon failure.
 * @param   {T}       data    - The data to be sanitized.
 * @param   {object}  options - If true, performs only validation of whether the data is structured-cloneable, without sanitizing. Throws an error if it's not cloneable.
 * @returns {T}               - The sanitized data. Also returns the original data if validation succeeds with checkOnly=true.
 * @throws  {Error} If the data is not structured-cloneable when checkOnly is true, or if an unexpected error occurs during sanitization.
 */
export function sanitizeForSendMessage<T>(data: T, options: SanitizeOptions = { checkOnly: false, debug: false }): T {
	const { checkOnly, debug } = options;

	try {
		// If structuredClone succeeds, the data is safe to be sent via sendMessage.
		structuredClone(data);

		return data;
	} catch (error) {
		// DataCloneError occurs if the object contains non-cloneable properties.
		// eslint-disable-next-line quotes
		if (error.name === 'DataCloneError') {
			if (checkOnly) {
				// If only checking, throw an error to notify.
				throw new Error("Data contains properties that cannot be structured cloned.", { cause: error, data });
			}

			// Execute sanitization.
			if (debug) {
				console.log("removeNonCloneableProperties(): Message contains non-cloneable data. Sanitizing... original:", data);
			}
			return removeNonCloneableProperties(data, debug);
		}
		// Re-throw any unexpected errors other than DataCloneError.
		throw new Error("An unexpected error occurred during the sanitization process.", { cause: error, data });
	}
}

/**
 * Recursively traverses an object or array and returns a new object with properties that cannot be structured-cloned (e.g., functions, symbols, DOM nodes) removed.
 * (Used as a fallback for sanitizeForSendMessage)
 * @param   {any} obj - The target object or array.
 * @returns {any}     - A new object or array with non-cloneable properties removed.
 */
function removeNonCloneableProperties(obj: any, debug: boolean): any {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(item => removeNonCloneableProperties(item, debug));
	}

	const newObj = {};
	for (const key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			const value = obj[key];
			const type = typeof value;

			// Exclude functions, symbols, and DOM nodes as they cannot be structured-cloned.
			if (type === "function" || type === "symbol" || (typeof Node !== "undefined" && value instanceof Node)) {
				if (debug) {
					console.log("removeNonCloneableProperties(): Exclude functions, symbols, and DOM nodes as they cannot be structured-cloned.", { key, value });
				}

				continue;
			}

			newObj[key] = removeNonCloneableProperties(value, debug);
		}
	}
	return newObj;
}