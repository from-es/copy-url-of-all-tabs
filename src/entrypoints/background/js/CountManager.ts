/**
 * Manager class for the pending URL count.
 *
 * @file
 * @lastModified 2026-03-24
 */

// Type definition for functions that receive notifications; accepts the new count as an argument.
// eslint-disable-next-line no-unused-vars
type Listener = (count: number) => void;



/**
 * Class that manages the count of URLs being processed and notifies subscribers of changes.
 *
 * Focuses on state management independently of the UI.
 */
class CountManager {
	#count    : number     = 0;   // Current count
	#listeners: Listener[] = [];  // List of subscribers (listener functions) notified of count changes

	/**
	 * Register a function to receive notifications and return a function to unsubscribe.
	 *
	 * @param   {Listener}   listener - The function that receives the new count.
	 * @returns {() => void}            A function to unsubscribe the registered listener.
	 */
	public subscribe(listener: Listener): () => void {
		this.#listeners.push(listener);

		// Return a function to unsubscribe.
		return () => {
			this.#listeners = this.#listeners.filter(removeListener => removeListener !== listener);
		};
	}

	/**
	 * Initialize the counter.
	 *
	 * @param {number} [initialCount=0] - The initial value, defaults to 0.
	 */
	public initialize(initialCount: number = 0): void {
		this.#setCount(initialCount);
	}

	/**
	 * Reset the counter to 0.
	 */
	public reset(): void {
		this.#setCount(0);
	}

	/**
	 * Increase the counter and notify all subscribers.
	 *
	 * @param {number} [value=1] - The value to increment by, defaults to 1.
	 */
	public increment(value: number = 1): void {
		this.#setCount(this.#count + value);
	}

	/**
	 * Decrease the counter and notify all subscribers.
	 *
	 * @param {number} [value=1] - The value to decrement by, defaults to 1.
	 */
	public decrement(value: number = 1): void {
		this.#setCount(Math.max(0, this.#count - value));
	}

	/**
	 * Return the current count.
	 *
	 * @returns {number} The current count.
	 */
	public getCount(): number {
		return this.#count;
	}

	/**
	 * Set the count and notify all registered subscribers.
	 *
	 * @param {number} newCount - The new count value.
	 */
	#setCount(newCount: number): void {
		this.#count = newCount;
		this.#notify();
	}

	/**
	 * Notify all registered subscribers with the current count.
	 */
	#notify(): void {
		for (const listener of this.#listeners) {
			listener(this.#count);
		}
	}
}



// Export as a singleton instance.
export const countManager = new CountManager();