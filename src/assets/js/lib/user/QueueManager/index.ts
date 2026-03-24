/**
 * Utility for managing task execution queues using p-queue.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import NPM Package
import PQueue from "p-queue";



// Specify `1` for serial task execution using `p-queue`.
const CONCURRENCY: number = 1;

/**
 * Class that manages serial task execution and priority control using `p-queue`.
 */
class QueueClass {
	readonly #LOWEST_PRIORITY: number = 0;
	readonly #empty          : number = 0;
	readonly #queue          : PQueue;
	         #HighestPriority: number = this.#LOWEST_PRIORITY + 1;

	/**
	 * @param {number} concurrency - The number of tasks to execute concurrently.
	 */
	constructor(concurrency: number) {
		this.#queue = new PQueue({ concurrency });
	}

	/**
	 * Adds a regular task to the queue.
	 *
	 * @param {function} task - The asynchronous task to execute.
	 */
	addTask(task: () => Promise<unknown>): void {
		this.#queue.add(task, { priority: this.#LOWEST_PRIORITY });
	}

	/**
	 * Adds a high-priority task to the queue. Tasks added later are given higher priority and executed sooner.
	 *
	 * @param {function} task - The asynchronous task to execute.
	 */
	addPriorityTask(task: () => Promise<unknown>): void {
		// Increment the priority with each call to ensure that newly added tasks are processed first.
		this.#HighestPriority++;
		// Assign the new priority.
		this.#queue.add(task, { priority: this.#HighestPriority });
	}

	/**
	 * Clears all tasks in the queue.
	 */
	clear(): void {
		this.#queue.clear();
	}

	/**
	 * Pauses the execution of tasks.
	 */
	pause(): void {
		this.#queue.pause();
	}

	/**
	 * Resumes the execution of tasks.
	 */
	resume(): void {
		this.#queue.start();
	}

	/**
	 * Determines if there are any tasks waiting or running in the queue.
	 *
	 * @returns {boolean} True if there are tasks, otherwise false.
	 */
	isActive(): boolean {
		return this.#queue.size > this.#empty || this.#queue.pending > this.#empty;
	}

	/**
	 * Gets the number of tasks waiting in the queue.
	 *
	 * @returns {number} The number of pending tasks.
	 */
	getPendingCount(): number {
		return this.#queue.size;
	}

	/**
	 * Gets the number of tasks currently running.
	 *
	 * @returns {number} The number of running tasks.
	 */
	getRunningCount(): number {
		return this.#queue.pending;
	}

	/**
	 * Returns a Promise that resolves when all tasks in the queue are completed.
	 *
	 * @returns {Promise<void>} A promise that resolves when all tasks are finished.
	 */
	onIdle(): Promise<void> {
		return this.#queue.onIdle();
	}
}



// Export as a singleton instance.
export const QueueManager = new QueueClass(CONCURRENCY);