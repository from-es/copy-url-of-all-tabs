/**
 * Utility for asynchronous waiting (sleep).
 *
 * @file
 * @lastModified 2026-06-09
 *
 * # sleep.ts
 *
 * ## Operational Specifications
 *
 * - **Waiting Logic**: Uses `setTimeout` to pause execution for a specified number of milliseconds.
 * - **Cancellation**: Supports `AbortSignal`. If a signal is aborted, the sleep is terminated immediately.
 * - **Error Handling**:
 *   - If the signal is already aborted when called, it resolves immediately with `false`.
 *   - If the signal is aborted during the wait, the timer is cleared and it resolves with `false`.
 *   - Throws `TypeError` or `RangeError` if the arguments are invalid.
 * - **Time Precision**: The `msec` value is truncated to an integer. Maximum allowed value is 2^31-1 (approx. 24.8 days).
 *
 * ## Usage Examples
 *
 * ### Basic Usage
 *
 * ```typescript
 * async function example() {
 *   console.info('Wait starts');
 *   await sleep(2000); // Waits for 2 seconds
 *   console.info('Wait ends');
 * }
 * ```
 *
 * ### Usage with Cancellation (AbortSignal)
 *
 * ```typescript
 * async function cancelableExample() {
 *   const controller = new AbortController();
 *
 *   // Start sleep and set up cancellation after 1 second.
 *   const sleepPromise = sleep(5000, { signal: controller.signal });
 *   setTimeout(() => controller.abort(), 1000);
 *
 *   const isCompleted = await sleepPromise;
 *   if (isCompleted) {
 *     console.info('Sleep completed naturally');
 *   } else {
 *     console.info('Sleep was cancelled via AbortSignal');
 *   }
 * }
 * ```
 */

/**
 * Generic type to hold the return value of setTimeout,
 * absorbing differences in execution environments (Browser/NodeJS).
 */
type SetTimeoutHandle = ReturnType<typeof setTimeout> | number | undefined;

/**
 * Asynchronously waits for the specified number of milliseconds.
 *
 * @param   {number}           msec             - The time to wait (in milliseconds). Valid range: 0 to 2,147,483,647 (2^31-1)
 * @param   {object}           [options]        - Optional settings.
 * @param   {AbortSignal}      [options.signal] - An AbortSignal to cancel the sleep.
 * @returns {Promise<boolean>}                    A promise that resolves to true if the time elapsed, false if aborted.
 * @throws  {TypeError}                           Thrown if the argument is not a number or is NaN.
 * @throws  {RangeError}                          Thrown if the argument is negative or exceeds the maximum allowed timeout.
 */
function sleep(msec: number, options?: { signal?: AbortSignal }): Promise<boolean> {
	const COMPLETED = true;  // The operation (sleep) completed as the specified time elapsed.
	const ABORTED   = false; // The operation (sleep) was cancelled via AbortSignal.

	const signal = options?.signal;

	// Validate arguments.
	validateArgs(msec, signal);

	// If the signal is already aborted, resolve with false immediately.
	if (signal?.aborted) {
		return Promise.resolve(ABORTED);
	}

	msec = Math.trunc(msec);

	return new Promise((resolve) => {
		let timer: SetTimeoutHandle = undefined;

		const abortHandler = () => {
			clearTimeout(timer);
			resolve(ABORTED);
		};

		// Register the abort listener.
		signal?.addEventListener("abort", abortHandler, { once: true });

		timer = setTimeout(() => {
			// Clean up the listener when the timer expires.
			signal?.removeEventListener("abort", abortHandler);
			resolve(COMPLETED);
		}, msec);
	});
}

/**
 * Validates the arguments for the sleep function.
 *
 * @param  {number}      msec   - The time to wait.
 * @param  {AbortSignal} signal - The optional AbortSignal.
 * @throws {TypeError}            Thrown if msec is not a number or signal is not an AbortSignal.
 * @throws {RangeError}           Thrown if msec is out of valid range.
 */
function validateArgs(msec: number, signal?: AbortSignal): void {
	if (typeof msec !== "number" || isNaN(msec)) {
		throw new TypeError("Invalid: argument 'msec' must be a number");
	}

	/**
	 * Due to the limitations of the setTimeout specification, the value must not exceed 2^31-1 (2,147,483,647)
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout#maximum_delay_value
	 */
	const MAX_TIMEOUT = 2_147_483_647;
	if (msec < 0 || msec > MAX_TIMEOUT) {
		throw new RangeError(`Invalid: argument 'msec' must be between 0 and ${MAX_TIMEOUT}`);
	}

	if (signal !== undefined && !(signal instanceof AbortSignal)) {
		throw new TypeError("Invalid: argument 'options.signal' must be an instance of AbortSignal");
	}
}



export {
	sleep
};