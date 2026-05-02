# QueueManager.ts

A singleton class that encapsulates `p-queue` to manage and serialize asynchronous tasks. It is a core component for handling operations like opening multiple tabs sequentially, ensuring order and preventing race conditions.

---

## Overview

In complex applications, especially browser extensions, managing a sequence of asynchronous operations (like API calls or opening tabs) is critical. `QueueManager` provides a robust, centralized solution for this. By enforcing a serial execution policy (`concurrency: 1`), it ensures that tasks are executed one by one, in a predictable order.

This utility is implemented as a singleton, meaning there is only one instance of the queue throughout the application. This prevents multiple, conflicting queues from being created and ensures all asynchronous tasks are funneled through a single, manageable channel. It leverages JavaScript Promises to manage asynchronous operations effectively.

## Minimum Requirements

This module operates correctly on browsers that support native Promise (Chrome 32+, Firefox 29+) and ECMAScript Private Class Fields (Chrome 74+, Firefox 68+).

## Key Features

- **Singleton Design:** Ensures a single, shared queue across the entire application, providing a centralized point of control for async tasks.
- **Serial Execution:** Guarantees that tasks run one at a time, preventing race conditions and ensuring predictable execution order.
- **Priority Queuing:** Supports a two-level priority system. High-priority tasks can be added to run before any pending low-priority tasks.
- **Non-Preemptive:** Once a task begins execution, it runs to completion and cannot be interrupted by a new high-priority task. Priority only affects the order of tasks in the *waiting* queue.
- **Robust Encapsulation:** Uses ECMAScript private fields (`#`) to completely hide the internal `p-queue` instance, exposing only a set of safe, controlled methods.
- **Lifecycle Control:** Provides methods to `pause`, `resume`, and `clear` the queue, allowing for fine-grained control over the task flow.

## Design Philosophy

### Underlying Library: `p-queue` and its Principles

`QueueManager` is a wrapper around the powerful `p-queue` library. Understanding its core principles is key to using `QueueManager` effectively.

#### 1. Task vs. Operation

A critical distinction exists between a **Task** and the **Operations** within it:
- **Task:** The Promise-returning function passed to `addTask()` or `addPriorityTask()`. `p-queue` manages the execution of this function as a single unit.
- **Operations:** The specific code inside the Task function (e.g., `for` loops, multiple `await` calls).

To `p-queue`, a Task is a black box. Once it starts, it will run to completion, regardless of how many internal operations it contains. The design of these Tasks—their **granularity**—is the most critical factor in enabling advanced control flow like effective "interruptions."

#### 2. Basic Operational Model

`p-queue` internally maintains two states:
- **Pending Queue:** Where tasks wait to be executed.
- **Active/Running:** The task currently being executed.

With `concurrency: 1`, only one task can ever be in the "Active" state, and all others must wait in the "Pending Queue."

#### 3. Priority and Execution Order

When a task is added, it can be assigned a priority. In `QueueManager`, `addPriorityTask` assigns a higher priority than `addTask`.
- **Higher number means higher priority.**
- When a new, high-priority task is added, it is inserted **before** lower-priority tasks in the *pending queue*.

#### 4. Non-Preemptive Nature

This is the most important characteristic: `p-queue` is **non-preemptive**.
- **A running task cannot be interrupted.** Even if a higher-priority task is added, the currently executing task will run to completion.
- **Priority is only evaluated** at the moment a task finishes and the queue selects the next task to run from the pending queue.

### Task Granularity

The effectiveness of the `QueueManager` heavily depends on the "granularity" of the tasks added to it. For the `addPriorityTask` method to function as an effective "interrupt," other tasks should be broken down into their smallest logical units.

- **Monolithic Task (Less Responsive):** If you add a single task that loops through 100 URLs, the queue is blocked for the entire duration. A high-priority task added during this loop must wait for all 100 URLs to be processed, making the system less responsive to urgent requests.

- **Granular Tasks (More Responsive):** If you split the URL opening process into tasks of an arbitrary size (e.g., batches of 10), or add them as individual tasks where each task opens a single URL, the queue has an opportunity to execute other tasks between each of those tasks. This creates chances for a high-priority task to "interrupt" the sequence, leading to a significant improvement in overall system responsiveness.

## Basic Usage

Here is a simple example of how to add tasks to the queue.

```typescript
import { QueueManager } from './QueueManager';
import { sleep } from '@/assets/js/utils/sleep'; // Assumes a utility sleep function

console.log("Adding tasks to the queue...");

// Add a standard (low-priority) task
QueueManager.addTask(async () => {
  console.log("Standard task started.");
  await sleep(1000);
  console.log("Standard task finished.");
});

// Add another standard task
QueueManager.addTask(async () => {
  console.log("Another standard task started.");
  await sleep(1000);
  console.log("Another standard task finished.");
});

// Add a high-priority task. This will run before "Another standard task".
QueueManager.addPriorityTask(async () => {
  console.log("High-priority task started.");
  await sleep(500);
  console.log("High-priority task finished.");
});

/*
Expected Console Output:
"Adding tasks to the queue..."
"Standard task started."
"Standard task finished."
"High-priority task started."
"High-priority task finished."
"Another standard task started."
"Another standard task finished."
*/
```

## API Reference

The `QueueManager` is exported as a singleton instance.

### `QueueManager.addTask(task)`

Adds a low-priority task to the queue.

- **`task: () => Promise<any>`**: An async function or a function that returns a Promise.

### `QueueManager.addPriorityTask(task)`

Adds a high-priority task to the queue. This task will be executed before any other pending low-priority tasks.

- **`task: () => Promise<any>`**: An async function or a function that returns a Promise.

### `QueueManager.clear()`

Removes all pending (not-yet-started) tasks from the queue.

### `QueueManager.pause()`

Pauses the queue. No new tasks will be started, but any currently running task will continue to completion.

### `QueueManager.resume()`

Resumes a paused queue.

### `QueueManager.isActive()`

Checks if there are any pending or running tasks.

- **Returns**: `boolean` - `true` if the queue size or pending count is greater than zero, `false` otherwise.

### `QueueManager.getPendingCount()`

Gets the number of tasks waiting to be executed.

- **Returns**: `number` - The number of tasks in the queue.

### `QueueManager.getRunningCount()`

Gets the number of tasks currently running. (Due to `concurrency: 1`, this will always be `0` or `1`).

- **Returns**: `number` - The number of running tasks.

### `QueueManager.onIdle()`

Returns a promise that resolves when the queue is empty and no tasks are running.

- **Returns**: `Promise<void>`

## References

- [p-queue (npm)](https://www.npmjs.com/package/p-queue)
- [p-queue (GitHub)](https://github.com/sindresorhus/p-queue)

## License

This project is licensed under the [MIT License](../../../../../../../LICENSE.md).
