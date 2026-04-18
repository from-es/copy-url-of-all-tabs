/**
 * Asynchronously waits for the specified number of milliseconds.
 *
 * @file
 * @lastModified 2026-04-18
 */

/**
 * Asynchronously waits for the specified number of milliseconds.
 *
 * @param   {number}        msec - The time to wait (in milliseconds). Valid range: 0 to 2,147,483,647 (2^31-1)
 * @returns {Promise<void>}        A promise that resolves after the specified time has elapsed
 * @throws  {TypeError}            Thrown if the argument is not a number or is NaN
 * @throws  {RangeError}           Thrown if the argument is negative or exceeds the maximum allowed timeout (2^31-1)
 *
 * @example
 * async function example() {
 *   console.info('INFO(util): Sleep processing start');
 *   await sleep(2000); // Wait for 2 seconds
 *   console.info('INFO(util): Sleep processing end');
 * }
 */
export function sleep(msec: number): Promise<void> {
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

	msec = Math.trunc(msec);

	return new Promise(resolve => setTimeout(resolve, msec));
}