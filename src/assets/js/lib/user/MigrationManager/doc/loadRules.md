# `loadRules` Utility Specifications

**Last Updated:** December 3, 2025

## Overview

The `loadRules` utility processes migration rule modules imported **synchronously** using `import.meta.glob` and provides the functionality to build a validated and sorted array of migration rules.

The main purpose of this utility is to guarantee the validity of the rule set passed to `MigrationManager` and to enable developers to immediately detect issues when they define an invalid rule (Fail-Fast design).

> [!IMPORTANT]
> **Execution Environment Constraints (Especially Service Workers)**
> For details, refer to the "[Notes on Execution Environment](#notes-on-execution-environment)" section below. When using this library in an environment where the `window` object does not exist, such as a Chrome extension's Service Worker, there are strict constraints on how modules can be loaded.

> [!WARNING]
> **Vite-Dependent Feature**
> The `import.meta.glob` function that this utility relies on is not a native browser feature but a unique feature provided by **Vite**. Therefore, if you use this library in a build environment other than Vite, you will need to provide an equivalent function to `import.meta.glob` (a mechanism to bulk import multiple modules matching a specific pattern).

## Main Features and Responsibilities

The `loadRules` function performs the following steps internally:

### 1. Rule Extraction

- It takes a module map (`Record<string, RuleModule<T>>`) obtained as a result of `import.meta.glob`.
- It extracts the `rules` property (`MigrationRule<T>[]`) from each module and flattens them into a single rule array.
- It throws an error if a module does not correctly export a `rules` array.

### 2. Rule Validation (Fail-Fast)

It strictly validates the structure of each extracted rule object. If even one invalid rule is found, it interrupts the process and throws a detailed error.

- **Required Properties:**
	- `condition`: Throws an error if not of `function` type.
	- `execute`: Throws an error if not of `function` type.
- **Optional Properties:**
	- `meta`: If it exists, its structure (required fields like `author`, `reason`, etc.) and the date format of `authored` (`YYYY-MM-DD`) are validated. Throws an error if invalid.
	- `order`: If it exists, throws an error if not of `number` type.

### 3. `order` Property Duplication Check (Fail-Fast)

- If the `order` property value is duplicated within the rule set, it throws an error to prevent unpredictable execution order.
- The error message includes details about which rules have a duplicate `order`.
- Rules without an `order` property are excluded from this check.

### 4. Rule Sorting

- All validated rules are sorted in ascending order (smallest first) based on the `order` property.
- Rules without an `order` property are placed after all rules that have one. The order among these rules is not guaranteed.

## API Reference

### `loadRules<T>(modules)`

- **Generics:**
	- **`<T>`**: The type of the data to be migrated.
- **Arguments:**
	- **`modules: Record<string, { rules: MigrationRule<T>[] }>`**: The result of `import.meta.glob` (module map). **To ensure compatibility in a Service Worker environment, you must import modules synchronously by always specifying the `{ eager: true }` option.**
- **Return Value:**
	- **`MigrationRule<T>[]`**: An array of validated and sorted migration rules. This array can be passed directly to the `MigrationManager` constructor.

## Basic Usage

`loadRules` is used within a rule aggregation file (e.g., `v1.rules.ts`) in combination with `import.meta.glob`.

```typescript
// file: src/path/to/rules/v1.rules.ts

import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules';
import type { Config } from '@/assets/js/types';

// Import all v1 series rule files [synchronously]
const modules = import.meta.glob('./v1/*.rule.ts', { eager: true });

// Load, validate, sort, and export the rules (synchronous process)
export const migrationRules = loadRules<Config>(modules);
```

## Error Handling (Fail-Fast Design)

`loadRules` is based on a Fail-Fast design philosophy to help discover rule definition problems immediately during development. When any of the following invalid states are detected, it outputs a detailed error to the console and throws an exception to stop the process:

- The module imported with `import.meta.glob` does not export a `rules` array.
- Required properties of a rule object (`condition`, `execute`) are missing or have an invalid type.
- `meta` or `order` properties exist but have an invalid structure or type.
- The `order` property value is duplicated across multiple rules.

This allows problems to be fixed during development or build time rather than at runtime, improving the reliability of the system.

## Notes on Execution Environment

### Constraints in a Service Worker Environment

A Chrome extension's Service Worker is a special execution environment that does not have a `window` global object. The module resolution mechanism provided by Vite/wxt has parts that are not compatible with this environment.

1.  **Prohibition of Dynamic Imports (`import()`):**
    The runtime code for dynamic imports (`import()` or the `{ eager: false }` option of `import.meta.glob`) bundled by Vite/wxt refers to the `window` object internally. Therefore, executing this in a Service Worker will cause a `ReferenceError: window is not defined` runtime error, stopping the process.

2.  **Prohibition of Top-Level `await`:**
    Service Worker scripts do not allow `await` in the top-level scope. Attempting to load modules asynchronously will cause the Service Worker registration itself to fail.

### Conclusion: Enforce Synchronous Imports

Due to the above constraints, when using this library, especially the `loadRules` utility, **you must always add the `{ eager: true }` option to `import.meta.glob` to bundle all rule modules at build time and load them synchronously.**

This architectural change also makes the `loadRules` function itself a **synchronous function**, not `async`, and it returns the rule array directly instead of a `Promise`.
