# SequenceProcessor Specification

**Last Updated:** June 20, 2026

The `SequenceProcessor` class is the core component that manages and executes a sequence of processing steps (rules) to transform data objects.

## Design Principles

### Generics and Type Safety

`SequenceProcessor<T, C>` uses TypeScript generics, allowing you to define the following types:
- **`T` (Target):** The type of the data to be processed.
- **`C` (Context):** The type of the context referenced during execution (e.g., environment details or external state).

This flexibility makes it suitable not only for data migration but also for general-purpose data transformation, state management, and multi-stage validation pipelines.

### Transactional Execution

Although processing runs step-by-step for each rule, it includes a rollback feature that restores the entire data object to its initial state upon encountering a critical error. This maintains data integrity and prevents incomplete or corrupted data states from remaining in the application.

## Execution Flow (`process` Method)

When `process(data, context, options)` is called, the following steps are executed:

1. **Initialization and Backup:**
	- Creates a copy of the input data based on the `immutableInput` option. This copy is retained as the original "snapshot" for rollback if a failure occurs.
2. **Rule Iteration:**
	- Evaluates all registered rules in ascending order based on their `order` property.
3. **Rule Filtering (`shouldExecute`):**
	- Computes whether to execute the rule by comparing the rule's `spec` (enabled, platforms, lifecycle) with the current `context`. Rules not matching the execution environment are automatically skipped.
4. **Individual Rule Execution (`executeRuleStep`):**
	- **Condition Check (`condition`):** Determines if the rule should run (e.g., checking if a specific property exists).
	- **Execution (`execute`):** Transforms the data.
	- **Error Handling:** If an error occurs during execution, the rule's `critical` flag is checked:
	  - **Critical (true):** Instantly aborts processing and rolls back the entire data object to the initial snapshot.
	  - **Non-Critical (false):** Discards changes from only this rule (restoring the state to the end of the previous rule) and proceeds to the next rule.
5. **Result Compilation:**
	- Returns the final data, execution status (`success`, `partial_success`, or `failed`), the history of applied rules, and a report of any errors that occurred.

## Execution Options (`SequenceOptions`)

- **`failFast` (boolean):** If `true`, aborts processing at the first failure even for non-critical errors.
- **`captureErrorSnapshots` (boolean):** If `true`, includes a snapshot of the data state immediately preceding the failure in the error report.
- **`immutableInput` (boolean):** If `false`, references the input data directly instead of performing an initial clone (useful for saving memory; normally recommended to be `true`).
- **`cloneFn` (function):** Specifies the function used for deep copying objects (defaults to `structuredClone`).

## Notes

### Deep Copying Objects

By default, this library uses the native `structuredClone` method for deep copying objects. However, the structured clone algorithm has the following limitations:

- **Unsupported Types**:
  - `Function`
  - `DOM nodes` (such as `Element`)
  - `Symbol`
  - Prototypes, property descriptors, getters, and setters are not cloned.
- **Error**: Attempting to clone an object containing unsupported types will throw a `DataCloneError`.

If you need to deep copy data that includes these unsupported types, implement a custom clone function or pass an external utility (such as `cloneDeep` from `lodash` / `lodash-es`) using the `options.cloneFn` option.

### Handling Large Binary Data

This library is designed to serve as a general-purpose pipeline that can process media data (such as `Blob`, `File`, or `Uint8Array` ranging from several MBs to hundreds of MBs).

Under the default configuration (the "3x model," where data-cloning processing expands memory consumption to roughly three times the original size, with error snapshots enabled), several deep clones occur to guarantee immutability and rollback safety. Consequently, when processing data size in hundreds of megabytes, memory consumption can swell to roughly three times (or more) the original size. This risks triggering out-of-memory (OOM) crashes in the browser or extension, or causing severe freeze due to garbage collection (GC) load.

To minimize memory footprint and cloning overhead when processing large binary files, it is highly recommended to combine the following options:

- **`options.immutableInput: false`**
  Skips the initial clone of the input data and starts processing directly on the reference.
- **`options.captureErrorSnapshots: false`**
  Disables storing data snapshots for the error history, preventing memory bloat.
- **`options.cloneFn: (d) => d`**
  Disables deep copying entirely, allowing in-place mutations. This also skips cloning for restoration at each step, minimizing CPU and memory load (※ Please ensure no side effects leak outside of your rules).

## Reference

- [Web APIs: structuredClone() method -  MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)
- [Web APIs: The structured clone algorithm - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm)
- [Glossary: Deep copy - MDN](https://developer.mozilla.org/en-US/docs/Glossary/Deep_copy)

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
