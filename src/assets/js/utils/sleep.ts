/**
 * Asynchronously waits for the specified number of milliseconds.
 *
 * @file
 * @lastModified 2026-03-24
 */

/**
 * Asynchronously waits for the specified number of milliseconds.
 *
 * @param   {number}        msec - The time to wait (in milliseconds)
 * @returns {Promise<void>}        A promise that resolves after the specified time has elapsed
 *
 * @example
 * async function example() {
 *   console.info('INFO(util): Sleep processing start');
 *   await sleep(2000); // Wait for 2 seconds
 *   console.info('INFO(util): Sleep processing end');
 * }
 */
export function sleep(msec: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, msec));
}