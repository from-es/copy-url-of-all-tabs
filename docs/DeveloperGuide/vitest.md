# Vitest: A Fast and Modern Unit Testing Framework

**Last Updated:** August 15, 2025

This document provides guidelines for writing unit and integration tests using [Vitest](https://vitest.dev/), the designated testing framework for this project.

## Overview

Vitest is a fast and modern testing framework with a Jest-compatible API, enabling intuitive and efficient testing. We use it to ensure our code is reliable, bug-free, and functions as expected.

## How to Write Tests

### Basic Test Structure

This section explains the fundamental rules and structure for writing test files.

1.  **File Naming**: Test files **must have the suffix** `.test.ts` or `.spec.ts` (e.g., `myFunction.test.ts`).
2.  **File Location**: It is recommended to place test files in a `__tests__` directory adjacent to the source file or in a centralized `tests` directory at the project root.
3.  **Test Structure**: A typical test file is structured using `describe`, `it` (or `test`), and `expect`.
    -   `describe(name, fn)`: Creates a block that groups together several related tests.
    -   `it(name, fn)`: This is the test case itself.
    -   `expect(value)`: Used to create an assertion. It is typically used with a "matcher" function (e.g., `toBe`, `toEqual`, `toHaveBeenCalled`).

### Test File Discovery

This section explains how Vitest discovers test files and clarifies the "File Location" recommendation above.

By default, Vitest automatically discovers files from all directories within the project that match patterns like `.test.ts` or `.spec.ts`. The directory structure mentioned above is a **recommendation for organizing test code, not a technical requirement for Vitest**. The test file discovery pattern is controlled by the `include` option in the configuration file. For details, refer to the [Vitest Official Documentation on Configuration](https://vitest.dev/config/).

### Test Code Examples

First, we will show a basic test that is self-contained within Vitest (Example 1), followed by a more advanced test for a Svelte component that requires additional libraries (Example 2).

#### Example 1: Pure Functions

Testing pure TypeScript/JavaScript functions that are not dependent on any framework is very straightforward.

First, install `vitest` as a development dependency.

```bash
npm install --save-dev vitest
```

Next, create the function to be tested, `add`, in the `tests/_vitest-check/utils/helpers.ts` file.

**`tests/_vitest-check/utils/helpers.ts`**
```typescript
export function add(a: number, b: number): number {
  return a + b;
}
```

Then, create the test code for this function in the `tests/_vitest-check/utils/helpers.test.ts` file.

```typescript
import { add } from './helpers';
import { describe, it, expect } from 'vitest';

describe('add function', () => {
  it('should return the sum of two numbers', () => {
    // Arrange
    const a = 1;
    const b = 2;

    // Act
    const result = add(a, b);

    // Assert
    expect(result).toBe(3);
  });

  it('should handle negative numbers', () => {
    expect(add(-1, -1)).toBe(-2);
  });
});
```

#### Example 2: Svelte Components

Testing Svelte components requires libraries such as `@sveltejs/vite-plugin-svelte`, `@testing-library/svelte`, and `jsdom`. These are used as a Vite plugin, for rendering the UI in a virtual DOM environment, and for simulating user interactions.

This testing method complies with the approach recommended in the official Svelte documentation. For more details, see [Testing - Svelte Docs](https://svelte.dev/docs/svelte/testing).

First, install the necessary development dependencies.

```bash
npm install --save-dev vitest jsdom @vitest/ui @sveltejs/vite-plugin-svelte @testing-library/svelte @vitest/coverage-v8
```

The roles of each installed module are as follows:

| Module                      | Description                                                                                               |
| :-------------------------- | :-------------------------------------------------------------------------------------------------------- |
| `vitest`                    | The core testing framework.                                                                               |
| `jsdom`                     | A library to simulate a DOM in a Node.js environment. Used for testing client-side components that require a browser environment. |
| `@vitest/ui`                | A UI for visually displaying Vitest test results. Used to interactively check test execution status in a browser. |
| `@sveltejs/vite-plugin-svelte` | A plugin to compile Svelte components with Vite. Required to process Svelte files in the test environment. |
| `@testing-library/svelte`   | A utility library for testing Svelte components. Used to simulate user interactions and verify component behavior. |
| `@vitest/coverage-v8`       | A provider for collecting and reporting test coverage. Uses the V8 engine's built-in coverage capabilities for fast performance. |

##### Environment

The configuration and code described in this document have been tested in the following environment. If you encounter issues after package updates, please compare your setup with this configuration.

| Package                         | Version    |
| :------------------------------ | :--------- |
| `svelte`                        | `^5.38.1`  |
| `vitest`                        | `^3.2.4`   |
| `jsdom`                         | `^26.1.0`  |
| `@sveltejs/vite-plugin-svelte`  | `^6.1.2`   |
| `@testing-library/svelte`       | `^5.2.8`   |
| `@vitest/ui`                    | `^3.2.4`   |
| `@vitest/coverage-v8`           | `^3.2.4`   |

<br>

Next, create a `vitest.config.ts` file in the project's root directory with the following content. This allows Vitest to operate with a dedicated test configuration, independent of WXT's build settings.

**`vitest.config.ts`**
```typescript
import { defineConfig, configDefaults } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    // Disable Svelte's Hot Module Replacement (HMR) during Vitest execution to ensure test stability.
    svelte({ hot: !process.env.VITEST }),
  ],
  // Set `resolve.conditions` at the top level.
  // This ensures that the `browser` field in `package.json` is prioritized for module resolution throughout Vitest's internal Vite instance.
  // It prevents errors where lifecycle functions like `onMount` are incorrectly identified as server-side during Svelte component tests.
  resolve: {
    conditions: ['browser'],
  },
  test: {
    // Makes `describe`, `it`, `expect`, etc., globally available without needing to import them in each test file.
    globals: true,

    // Sets JSDOM as the test environment. This simulates DOM APIs in a Node.js environment,
    // enabling tests for components that run in a browser.
    environment: 'jsdom',

    // Specifies patterns for files or directories to be excluded from testing.
    // By default, smoke tests for environment verification are excluded.
    exclude: [
      // It's recommended to inherit the default exclusions to avoid accidentally including files from node_modules.
      ...configDefaults.exclude,
      '_vitest-check/**',
    ],
  },
});
```

**Note:** `resolve.conditions` must be placed at the top level of the configuration, not inside the `test` object. This ensures the setting applies to Vite's overall module resolution, allowing Svelte to operate correctly in browser mode.

Next, create a simple counter component to be tested (`Counter.svelte`).

**`tests/_vitest-check/components/Counter.svelte`**
```html
<script lang="ts">
  import { onMount } from "svelte";

  export let count: number = 0;
  const increment = () => {
    count += 1;
  };

  onMount(() => {
    // If browser-specific lifecycle functions like onMount are included,
    // an error will occur if Vitest does not correctly recognize the browser environment.
    console.log("Counter component mounted");
  });
</script>

<main>
  <h1>Counter</h1>
  <p>Current count: {count}</p>
  <button on:click={increment}>Increment</button>
</main>
```

And then, write the test for this component (`Counter.test.ts`).

**`tests/_vitest-check/components/Counter.test.ts`**
```typescript
import { render, fireEvent, screen, cleanup } from '@testing-library/svelte';
import { describe, it, expect, afterEach } from 'vitest';
import Counter from './Counter.svelte';

describe('Counter.svelte', () => {
  // Cleans up the DOM after each test to prevent side effects (like lingering state) between tests.
  afterEach(() => cleanup());

  it('should mount the component and display the initial count correctly', () => {
    // 1. Arrange: Render the component with an initial count of 0.
    render(Counter, { props: { count: 0 } });

    // 2. Assert: Verify that an element with the text "Current count: 0" exists.
    expect(screen.getByText('Current count: 0')).toBeTruthy();
  });

  it('should increment the count on button click', async () => {
    // 1. Arrange: Render the component with an initial count of 0.
    render(Counter, { props: { count: 0 } });
    const button = screen.getByText('Increment');

    // 2. Act: Click the button once.
    await fireEvent.click(button);

    // 3. Assert: Verify that the count is now 1.
    expect(screen.getByText('Current count: 1')).toBeTruthy();

    // 4. Act: Click the button again.
    await fireEvent.click(button);

    // 5. Assert: Verify that the count is now 2.
    expect(screen.getByText('Current count: 2')).toBeTruthy();
  });
});
```

## How to Run Tests

Define the following test scripts in your `package.json`. For efficiency, it is recommended to separate the commands for running main project tests and environment smoke tests.

**`package.json`**
```json
{
  "scripts": {
    "test": "vitest run",
    "test:smoke": "vitest run _vitest-check/",
    "vitest": "vitest",
    "vitest:ui": "vitest --ui",
    "vitest:coverage": "vitest run --coverage"
  }
}
```

This allows you to run tests for various purposes with the following commands.

---

### `npm run test`

**Purpose:** Run all main project tests.

**Behavior:** Executes all tests for the application, excluding the smoke tests in the `_vitest-check/` directory. This is the primary command to use during regular development to verify the application's functionality.

```bash
npm run test
```

### `npm run test:smoke`

**Purpose:** Verify the test environment.

**Behavior:** Runs only the tests within the `_vitest-check/` directory. This is useful after installing or updating test-related packages to ensure that the Vitest environment is correctly configured.

```bash
npm run test:smoke
```

### `npm run vitest`

**Purpose:** Continuous test execution during development (watch mode).

**Behavior:** Starts Vitest in **watch mode**. It watches for file changes and automatically re-runs relevant tests, providing rapid feedback.

```bash
npm run vitest
```

### `npm run vitest:ui`

**Purpose:** Interactive analysis of test results.

**Behavior:** Launches a graphical UI in the browser to visually inspect test results. (Requires `@vitest/ui`).

```bash
npm run vitest:ui
```

### `npm run vitest:coverage`

**Purpose:** Generate a test coverage report.

**Behavior:** Runs tests and measures code coverage, generating a detailed report in the `coverage/` directory. (Requires `@vitest/coverage-v8`).

```bash
npm run vitest:coverage
```

## Q&A

### Q. Why use a testing framework like Vitest? What's the difference between checking with `console.log` or writing temporary test logic in the source code?

**A.** While `console.log` is very useful for temporary debugging, using a testing framework, especially Vitest, offers many advantages beyond that.

First is the **separation of test code and production code**. A major benefit of Vitest is that it allows you to verify behavior without adding test-specific code to the application's source. This keeps the production code clean while allowing for robust tests in separate files, preventing the risk of including unnecessary test code in the final product.

Second is **test automation and structuring**.

-   **Automation:** With a single command like `npm run vitest`, you can run hundreds of test cases at once, automatically. This is incomparably more efficient than manual verification.
-   **Structuring:** Using syntax like `describe` and `it` clarifies "what" is being tested and under "what conditions." The test code itself serves as a form of living documentation, enhancing code maintainability.
-   **Clear Results:** Assertions like `expect(result).toBe(3)` provide a clear pass/fail judgment for tests. There's no need for a developer to visually interpret `console.log` output.

For these reasons, a testing framework like Vitest is an indispensable tool for maintaining quality and safely evolving software over time.

### Q. Do test files need to be placed in a specific directory?

**A.** No, it is not mandatory. Placing them in a `__tests__` directory adjacent to source files or in a root `tests` directory is merely a **recommendation** to keep code organized.

By default, Vitest automatically discovers files ending in `.test.ts` or `.spec.ts` from all directories within the project as test files.

Note that Vitest, by default, excludes files and directories matching the following patterns from testing (for details, see the [`exclude` option in the Vitest official documentation](https://vitest.dev/config/#exclude)).
-   `**/node_modules/**`
-   `**/dist/**`
-   `**/cypress/**`
-   `**/.{idea,git,cache,output,temp}/**`
-   `**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*`

This file discovery pattern can be freely changed using the `include` option in the configuration file (`vitest.config.ts`). For more details, please refer to the [Vitest Official Documentation on Configuration](https://vitest.dev/config/).

### Q. What is a "coverage report"?

**A.** It is a report that measures and visualizes the extent to which your created tests cover the source code.

Viewing a coverage report offers the following benefits:

-   **Identifying Untested Areas**
    The report highlights code lines and branches (like if-statements) that were not executed by tests. This makes it easy to find where tests are missing and provides guidance for writing more reliable code.

-   **Objective Evaluation of Code Quality**
    You can objectively assess the quality of your tests with concrete numbers (coverage rate), such as "80% of the entire code is tested." Making this a development goal for the team can lead to maintaining and improving quality.

-   **Safe Refactoring**
    By checking that the coverage rate has not unintentionally decreased after modifying code, you can reduce the risk of "degradations" that break existing functionality.

The `npm run vitest:coverage` command mentioned in the document is used to generate this report using Vitest's functionality.

## Official Website and Documentation

For more detailed information, please refer to the official Vitest website and documentation.

-   [Vitest Official Site](https://vitest.dev/)
-   [Vitest Documentation](https://vitest.dev/guide/)
