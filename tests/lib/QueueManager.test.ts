/**
 * Tests for QueueManager
 *
 * Verifies the serial queue processing behavior provided by each method of `QueueManager`
 * (e.g., addTask, addPriorityTask).
 *
 * This test needs to strictly verify the execution order of the asynchronous flow,
 * and since there are strong side effects and timing dependencies, this test uses individual
 * 'it' blocks sequentially rather than data-driven testing via TestRunner.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, beforeEach, expect } from "vitest";
import { QueueManager } from "@/assets/js/lib/QueueManager";

describe("QueueManager", () => {
	beforeEach(async () => {
		// Cleanup
		QueueManager.clear();
		await QueueManager.onIdle();
	});

	it("should execute regular tasks serially in the order they were added", async () => {
		const results: number[] = [];
		const task = (id: number, delayMs: number) => async () => {
			await new Promise(resolve => setTimeout(resolve, delayMs));
			results.push(id);
		};

		// Add sequentially (asynchronous execution)
		QueueManager.addTask(task(1, 20));
		QueueManager.addTask(task(2, 10));

		await QueueManager.onIdle();

		// Confirm they are executed serially in the order added, regardless of delay.
		expect(results).toEqual([ 1, 2 ]);
	});

	it("should execute priority tasks by overtaking regular tasks", async () => {
		const results: number[] = [];
		const task = (id: number, delayMs: number) => async () => {
			await new Promise(resolve => setTimeout(resolve, delayMs));
			results.push(id);
		};

		// Block the queue with the first task
		QueueManager.addTask(task(1, 20));

		// Insert new tasks during this time
		// Order: priority task -> normal task -> priority task
		QueueManager.addTask(task(2, 5));
		QueueManager.addPriorityTask(task(3, 5));
		QueueManager.addTask(task(4, 5));
		QueueManager.addPriorityTask(task(5, 5));

		await QueueManager.onIdle();

		// Task 1 (running) -> Task 5 (most recent priority) -> Task 3 (next priority) -> Task 2 (normal) -> Task 4 (normal)
		// Since priority is incremented each time addPriorityTask is called, tasks added later have higher priority.
		expect(results).toEqual([ 1, 5, 3, 2, 4 ]);
	});

	it("should correctly retrieve activity state (isActive / pendingCount / runningCount)", async () => {
		QueueManager.pause(); // Pause the queue

		QueueManager.addTask(async () => { await new Promise(r => setTimeout(r, 10)); });
		QueueManager.addTask(async () => { await new Promise(r => setTimeout(r, 10)); });

		// Since paused: pending: 2, running: 0
		expect(QueueManager.isActive()).toBe(true);
		expect(QueueManager.getPendingCount()).toBe(2);
		expect(QueueManager.getRunningCount()).toBe(0);

		QueueManager.resume();

		await QueueManager.onIdle();

		// After completion
		expect(QueueManager.isActive()).toBe(false);
		expect(QueueManager.getPendingCount()).toBe(0);
		expect(QueueManager.getRunningCount()).toBe(0);
	});
});