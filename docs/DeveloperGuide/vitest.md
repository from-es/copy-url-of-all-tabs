# Vitest Guide: From Basics to Project Standards

**Last Updated:** April 21, 2026

This document provides a comprehensive guide to unit and integration testing in this project using [Vitest](https://vitest.dev/). It is divided into three parts: basics for beginners, our project's specific recommended standards, and advanced usage.

---

## Part 1: Vitest Basics (For Beginners)

### 1.1 Why We Use a Testing Framework
While `console.log` is useful for quick debugging, Vitest provides:
- **Separation of Concerns**: Test code stays out of your production logic.
- **Automation**: Run hundreds of checks in seconds with one command.
- **Documentation**: Tests describe how code *should* behave, serving as living documentation.
- **Reliability**: Automated assertions ensure that "Pass" means "Pass," without manual interpretation.

### 1.2 The AAA Pattern
To keep tests readable, we follow the **Arrange → Act → Assert** pattern:
1.  **Arrange**: Set up the environment, variables, and mocks.
2.  **Act**: Execute the function or behavior being tested.
3.  **Assert**: Verify that the result matches your expectations.

### 1.3 Basic Structure (`describe`, `it`, `expect`)
```typescript
import { describe, it, expect } from 'vitest';

describe('math module', () => {
  it('should add numbers correctly (The "it" block is the test case)', () => {
    // Arrange
    const a = 1;
    const b = 2;

    // Act
    const result = a + b;

    // Assert
    expect(result).toBe(3);
  });
});
```

---

## Part 2: Project Standards (Recommended Construction)

To maintain a high-quality test suite, all tests in this project should adhere to these standards.

### 2.1 Data-Driven Testing with `TestRunner`
We promote **Data-Driven Testing** where test data is separated from execution logic. We use a static `TestRunner` utility to handle the execution cycle.
- **Benefit**: Reduces boilerplate and makes tests declarative. You only need to define "What" is being tested, not "How" the loop runs.

### 2.2 Directory Structure (`shared/`)
Test support files are centralized in the `tests/shared/` directory:
- **`support/TestRunner.ts`**: The core execution engine.
- **`support/setup.ts`**: Global mocks (e.g., `wxt/browser`) that run automatically.
- **`fixtures/`**: Static JSON data or factory functions for complex objects.

### 2.3 Import Normalization
To enhance readability, normalize Vitest imports into these 4 categories:
1.  **Category 1: Structure**: `describe`, `it`, `test`, `suite`
2.  **Category 2: Lifecycle**: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`
3.  **Category 3: Assertion**: `expect`, `assert`
4.  **Category 4: Utility**: `vi`

**Rule**: Sort by category number, then alphabetically within each category.
*Example:* `import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";`

### 2.4 Documentation Standards (JSDoc)
Every test file must include a `@file` header. Use `@see` to link to the testing infrastructure to help new developers understand the setup.

### 2.5 Master Test Template
Use this template as your starting point for new tests.

```typescript
/**
 * {{Module Name}} Tests
 *
 * {{Brief description of the test's purpose.}}
 *
 * @file
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 */

import { describe, beforeEach, afterEach, expect, vi } from "vitest";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Test Data (Separation of Data and Logic)
// =============================================================================

const testData = {
	successCases: [
		{ name: "should handle case A", input: { val: 1 }, expected: 2 },
		{ name: "should handle case B", input: { val: 2 }, expected: 4 }
	],
	errorCases: [
		{ name: "should throw on invalid input", input: null, expected: "Invalid input" }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration (Structure)
// =============================================================================

describe("{{Module Name}}", () => {
	let context: any;

	beforeEach(() => {
		// Arrange: Standard preparation
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Cleanup
	});

	describe("Success cases", () => {
		TestRunner.success(testData.successCases, context, (input) => {
			// return targetFunction(input);
		});
	});

	describe("Error handling", () => {
		TestRunner.error(testData.errorCases, context, (input) => {
			// targetFunction(input);
		});
	});
});
```

### 2.6 Handling Exceptions
If a test is too complex for `TestRunner` (e.g., strict async sequencing), you may use standard `it` blocks.
- **Requirement**: You **must** explain why the standard pattern was not used in the file's JSDoc.

---

## Part 3: Advanced Usage & Configuration

### 3.1 Svelte Component Testing
Requires `jsdom` and `@testing-library/svelte`.
- **Cleanup**: Always call `cleanup()` in `afterEach` to prevent state leakage between tests.

### 3.2 Coverage Goals
We aim for high reliability through measurable coverage:
- **Immediate Goal**: >80% line coverage for the `lib/` directory.
- **Project Goal**: >75% overall coverage across `lib/` and `utils/`.

### 3.3 Running Tests (CLI Commands)
- `npm run vitest:run`: Execute all main project tests once.
- `npm run vitest`: Start watch mode for active development.
- `npm run vitest:ui`: Visual UI for analyzing results.
- `npm run vitest:coverage`: Generate coverage reports.
- `npm run vitest:smoke`: Verify the test environment (using `tests/_vitest-check/`).

---

## Official Documentation
- [Vitest Official Site](https://vitest.dev/)
- [Vitest Documentation](https://vitest.dev/guide/)
