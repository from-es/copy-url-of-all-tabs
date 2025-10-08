# CompareVersions

**Last Updated:** October 8, 2025

A utility for comparing Semantic Versioning (SemVer) formatted version strings.

---

## Overview

By calling the `compareVersions(base, target)` method, you can determine the relative order of two SemVer-formatted version strings. This utility strictly adheres to the [SemVer 2.0.0](https://semver.org/) specification, comparing versions based on the following format.

**Version Format: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILDMETADATA]`**

*   **`MAJOR` (Major Version):** Incremented for incompatible API changes.
*   **`MINOR` (Minor Version):** Incremented for backward-compatible feature additions.
*   **`PATCH` (Patch Version):** Incremented for backward-compatible bug fixes.
*   **`PRERELEASE` (Prerelease Identifier):** The part following a hyphen (`-`), indicating that it is not a stable version (e.g., `1.0.0-alpha.1`). Prerelease versions have lower precedence than their associated normal version.
*   **`BUILDMETADATA` (Build Metadata):** The part following a plus sign (`+`), providing additional build information (e.g., `1.0.0+build.123`). Build metadata does not affect version precedence.

This utility compares versions based on major, minor, patch, and prerelease identifiers. Build metadata does not affect the comparison.

An error will be thrown if an invalid version string is passed as an argument.

## Features

- **SemVer 2.0.0 Compliant:** Compares versions according to the strict rules of Semantic Versioning.
- **Strict Input Validation:** Thoroughly validates whether the input version strings conform to the SemVer format. Checks string length, basic formatting, and adherence to the SemVer 2.0.0 specification.
- **Prerelease Version Comparison:** Accurately handles comparison rules for versions including prerelease identifiers (e.g., `1.0.0-alpha`, `1.0.0-beta.1`).
- **Build Metadata Ignored:** Build metadata (e.g., `1.0.0+build.123`) does not affect version precedence and is ignored during comparison.
- **Self-Contained:** Functions independently without relying on external libraries.

## Basic Usage

Here is a basic example of how to use it.

```typescript
import { compareVersions } from '../index'; // or './CompareVersions'

// If target is greater than base (1.0.1 > 1.0.0)
const result1 = compareVersions("1.0.0", "1.0.1"); // 1

// If target and base are equal (1.0.0 == 1.0.0)
const result2 = compareVersions("1.0.0", "1.0.0"); // 0

// If target is less than base (1.0.0 < 1.1.0)
const result3 = compareVersions("1.1.0", "1.0.0"); // -1

// Prerelease version comparison (1.0.0-alpha < 1.0.0-alpha.1)
const result4 = compareVersions("1.0.0-alpha", "1.0.0-alpha.1"); // 1

// Prerelease vs stable version comparison (1.0.0-alpha < 1.0.0)
const result5 = compareVersions("1.0.0-alpha", "1.0.0"); // 1

console.log(result1, result2, result3, result4, result5);
```

## API Reference

### `compareVersions(base: unknown, target: unknown): CompareVersionsResult`

Compares two Semantic Versioning formatted version strings and returns their relative order.

- **`base: unknown`**: The base version string for comparison.
- **`target: unknown`**: The target version string for comparison.
- **Returns: `CompareVersionsResult` (`-1 | 0 | 1`)**:
    - `1`: If `target` is greater than `base`.
    - `0`: If `target` is equal to `base`.
    - `-1`: If `target` is less than `base`.
- **Throws Error**: Throws an `Error` if an invalid version string is passed.

### `SemVerString` Type

A Branded Type indicating that a string is in Semantic Versioning format. It is only effective at compile time and is treated as a regular `string` at runtime.

### `CompareVersionsResult` Type

The return type of the `compareVersions` function, which is one of the numbers `-1`, `0`, or `1`.

## Behavioral Specifications & Notes

### Semantic Versioning 2.0.0 Compliance

This utility strictly adheres to the [SemVer 2.0.0](https://semver.org/) specification for version comparison. Specifically, prerelease version comparison rules are accurately applied. Build metadata does not affect the comparison.

The SemVer 2.0.0 specification defines the following rules for comparing prerelease versions:

1.  **A version without a prerelease identifier has higher precedence than a version with one.**
    *   Example: `1.0.0` > `1.0.0-alpha`
2.  **When comparing two versions with prerelease identifiers, the identifiers are compared from left to right, separated by dots.**
3.  **Identifiers are compared differently depending on whether they are numeric or alphanumeric.**
    *   **Numeric identifiers:** Compared numerically.
        *   Example: `1.0.0-alpha.1` < `1.0.0-alpha.2`
    *   **Alphanumeric identifiers:** Compared lexicographically in ASCII sort order.
        *   Example: `1.0.0-alpha` < `1.0.0-beta` (a < b)
    *   **Mixed numeric and alphanumeric:** Numeric identifiers have lower precedence than alphanumeric identifiers.
        *   Example: `1.0.0-alpha.1` < `1.0.0-alpha.beta` (numeric < alphanumeric)
4.  **If a common prefix is the same but one set of identifiers has more fields, the one with more fields has higher precedence.**
    *   Example: `1.0.0-alpha` < `1.0.0-alpha.1`

This utility strictly applies these rules for prerelease version comparison.

### Strict Input Validation

Arguments passed to the `compareVersions` function are strictly validated internally.
- **Type Validation:** An error is thrown if a non-`string` argument is passed.
- **String Length:** An error is thrown if the version string's length exceeds the maximum allowed length (128 characters).
- **Format Validation:** An error is thrown if the version string does not conform to the SemVer 2.0.0 specification. This includes a simple regex check for ReDoS protection and a detailed SemVer regex check.

### Error Handling

If an invalid version string is passed to the `compareVersions` function, an `Error` is thrown. Callers should use `try...catch` blocks to handle these errors appropriately.

### Execution Context

This utility is a pure logic function and does not depend on DOM manipulation or specific browser APIs. Therefore, it can be safely used in both client-side (Content Scripts, Popup, Options pages, etc.) and server-side (Node.js environments, etc.) contexts.
