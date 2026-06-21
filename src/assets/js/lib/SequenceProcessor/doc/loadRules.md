# `loadRules` Utility Specification

**Last Updated:** June 20, 2026

## Overview

The `loadRules` utility reads rules from multiple sources (either directly as an array or as a module map via `import.meta.glob`), validates and sorts them, and formats them for use by `SequenceProcessor`.

It is designed with a Fail-Fast philosophy, catching issues during load time rather than runtime if a developer defines an invalid rule.

## Key Features

### 1. Rule Extraction (`extractRulesFromModules`)

- Accepts rules in array format directly, or extracts the `rules` export from a set of modules retrieved via `import.meta.glob` to create a flattened array.

### 2. Rule Validation (`partitionRules`)

Strictly checks the structure and types of all rule objects.
- **Required Fields Validation:** Verifies that `meta.name`, `meta.description.reason`, `process.condition`, and `process.execute` are present and have the correct type.
- **Structure Validation:** If `spec` or `order` are defined, verifies that their structures comply with the schema definitions.
  - If `spec.lifecycle` is defined, validates that its internal `introduced` and `obsoleted` fields are strings.
- Throws a detailed `Error` containing all accumulated validation messages if any invalid rules are found.

### 3. Duplication Check (`checkForDuplicateOrders`)

- Throws an error if any duplicate `order` property values are detected in the rule set to prevent unintended execution ordering.

### 4. Sorting (`sortAndCombineRules`)

- Sorts rules in ascending order based on their `order` property.
- Rules without a specified `order` are placed at the end of the list.
- Maintains the original insertion order (stable sort) for rules that share the same `order` value (such as multiple rules without a specified `order`).

## API Reference

### `loadRules<T, C>(modules)`

- **TypeScript Generics:**
	- **`<T>`**: The type of the target data to be processed.
	- **`<C>`**: The type of the context.
- **Arguments:**
	- **`modules`**: `SequenceRule<T, C>[]` or `ImportModules<T, C>`.
- **Return Value:**
	- **`SequenceRule<T, C>[]`**: A validated and sorted array of rules.

## Basic Usage

Typically combined with `import.meta.glob` in the file that aggregates rules.

```typescript
// rules/index.ts
import { loadRules } from "../../lib/SequenceProcessor/loadRules";
import type { Config, Context } from "../../types";

// Synchronous import
const modules = import.meta.glob('./*.rule.ts', { eager: true });

export const sequenceRules = loadRules<Config, Context>(modules);
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
