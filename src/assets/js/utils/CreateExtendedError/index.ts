/**
 * Utility for creating extended error objects with additional context.
 *
 * @file
 * @lastModified 2026-04-18
 *
 * @remarks
 * This utility uses `Error.captureStackTrace` to remove itself from the stack trace,
 * ensuring that the trace points directly to the caller's location.
 * Note that `Error.captureStackTrace` is a non-standard feature; it is supported
 * in V8-based browsers (Chrome, Edge), Firefox (120+), and Safari (17.2+).
 * In unsupported environments, the stack trace will still be generated but may
 * include this utility function in the call stack.
 *
 * @see {@link https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Error/captureStackTrace | Error.captureStackTrace - MDN}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/stack | Error.stack - MDN}
 */

/**
 * Interface representing an Error object with optional extended properties.
 *
 * @template D Type of the metadata stored in 'detail'
 */
interface ExtendedError<D extends Record<string, unknown> = Record<string, unknown>> extends Error {
	/**
	 * Metadata for subsequent error handling and debugging.
	 * Defined as readonly to prevent unintended modifications and ensure context immutability.
	 * Set to null if no string-keyed custom metadata was provided in options.
	 *
	 * @remarks
	 * Only string-keyed properties from options are stored here.
	 * Symbol-keyed properties are not supported and will be silently ignored.
	 */
	readonly detail: D | null;
}

/**
 * Interface representing options for creating an extended error.
 * Extends standard ErrorOptions to support Error Chaining (cause)
 * and allows arbitrary metadata.
 *
 * @template D Type of the metadata properties
 */
type ExtendedErrorOptions<D extends Record<string, unknown> = Record<string, unknown>> = ErrorOptions & {
	/**
	 * Function to start capturing the stack trace from.
	 * This function and its callers will be excluded from the stack trace.
	 * If set to `null`, stack trace adjustment (removal) is skipped.
	 * Defaults to `createExtendedError`.
	 */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	stackStartFn?: Function | null;
} & D;

/**
 * Type representing a constructor for an Error or its subclasses.
 *
 * @remarks
 * The standard Error constructor only accepts 'ErrorOptions' (containing only 'cause').
 * Therefore, the type definition must follow the standard. Custom metadata is attached manually after instantiation.
 *
 * @template T The type of the Error instance to be created
 */
// eslint-disable-next-line no-unused-vars -- Exported as a public type; used only in type positions
type ErrorConstructor<T extends Error> = new (message?: string, options?: ErrorOptions) => T;



/**
 * Validates the arguments to ensure early detection of incorrect utility usage.
 *
 * @remarks
 * Parameters are typed as `unknown` intentionally to enforce Fail-Fast validation
 * regardless of how the function is called at runtime (e.g., via untyped JavaScript).
 *
 * @param  {unknown}   ErrorType - The constructor to instantiate
 * @param  {unknown}   message   - The error message
 * @param  {unknown}   options   - The options object
 * @throws {TypeError}             If requirements for a valid Error instantiation are not met
 */
function validateArguments(ErrorType: unknown, message: unknown, options: unknown): void {
	if (typeof message !== "string" || message.trim().length === 0) {
		throw new TypeError(`Invalid argument 'message': a non-empty string is required, but ${typeof message} was provided.`);
	}

	if (typeof ErrorType !== "function") {
		throw new TypeError(`Invalid argument 'ErrorType': a constructor function is expected, but ${typeof ErrorType} was provided.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- ErrorType is typed as unknown; cast is required to access .prototype
	const isErrorConstructor = ErrorType === Error || (ErrorType as any).prototype instanceof Error;
	if (!isErrorConstructor) {
		throw new TypeError("Invalid argument 'ErrorType': must be a constructor that inherits from Error.");
	}

	if (options !== undefined && (typeof options !== "object" || options === null)) {
		throw new TypeError(`Invalid argument 'options': an object is expected, but ${typeof options} was provided.`);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Options is typed as unknown; cast is required to safely access 'stackStartFn' during runtime validation.
	const stackStartFn = (options as any)?.stackStartFn;
	if (stackStartFn !== undefined && stackStartFn !== null && typeof stackStartFn !== "function") {
		throw new TypeError(`Invalid option 'stackStartFn': a function, null, or undefined is expected, but ${typeof stackStartFn} was provided.`);
	}
}

/**
 * Creates an extended error object of the specified type with additional context.
 *
 * @remarks
 * This utility aims to attach arbitrary metadata to an error object while supporting
 * standard Error Chaining (cause). All additional attributes are encapsulated within
 * the 'detail' property.
 *
 * Note: The assignment of `metadata` to `detail` relies on a runtime cast (`metadata as D`).
 * TypeScript cannot statically verify the exact shape of D from the spread remainder,
 * so callers are responsible for passing correctly typed options.
 *
 * @template T                                     Error class type (defaults to `Error`)
 * @template D                                     Metadata type (defaults to `Record<string, unknown>`)
 * @param    {ErrorConstructor<T>}     ErrorType - The constructor of the Error class to instantiate (defaults to `Error`).
 * @param    {string}                  message   - The non-empty error message.
 * @param    {ExtendedErrorOptions<D>} [options] - Optional object containing 'cause' and any custom metadata.
 * @returns  {T & ExtendedError<D>}                The instantiated error object with extended properties.
 * @throws   {TypeError}                           Thrown if message is invalid or ErrorType is not an Error constructor.
 *
 * @example
 * // 1. Basic usage
 * throw createExtendedError(Error, "Something went wrong");
 *
 * // 2. Usage with metadata (Typed)
 * interface ApiErrorDetail { category: string; id: number }
 * const error = createExtendedError<Error, ApiErrorDetail>(Error, "Failed", { category: "API", id: 404 });
 * console.log(error.detail?.id);  // 404
 */
function createExtendedError<T extends Error = Error, D extends Record<string, unknown> = Record<string, unknown>>(
	ErrorType: ErrorConstructor<T> = Error as unknown as ErrorConstructor<T>,  // Default value `Error` is assignable at runtime but cannot satisfy the generic constraint statically
	message  : string,
	options  : ExtendedErrorOptions<D> = {} as ExtendedErrorOptions<D>
): T & ExtendedError<D> {
	validateArguments(ErrorType, message, options);

	const { cause, stackStartFn = createExtendedError, ...metadata } = options;

	// Pass { cause } only when defined to avoid setting error.cause to undefined explicitly.
	const error = new ErrorType(message, cause !== undefined ? { cause } : {}) as T & ExtendedError<D>;

	// Capture stack trace immediately after instantiation so the trace points to the caller.
	if (typeof Error.captureStackTrace === "function" && stackStartFn !== null) {
		Error.captureStackTrace(error, stackStartFn);
	}

	// Use Object.defineProperty to enforce readonly at the runtime level,
	// matching the intent of the `readonly detail` declaration in ExtendedError.
	const hasMetadata = Object.keys(metadata).length > 0;
	Object.defineProperty(error, "detail", {
		value       : hasMetadata ? (metadata as D) : null,
		writable    : false,
		enumerable  : true,
		configurable: false,
	});

	return error;
}



export type {
	ExtendedError,
	ExtendedErrorOptions,
	ErrorConstructor
};
export {
	createExtendedError
};