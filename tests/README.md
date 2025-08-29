# Tests

This directory contains all the automated tests for the "Copy URL of All Tabs" extension.

## About

We use [Vitest](https://vitest.dev/) as our testing framework. The primary goal of these tests is to ensure the reliability and correctness of the extension's logic.

Tests are categorized as follows:

-   **Unit Tests**: Verify the functionality of individual functions and modules in isolation. These are the most common type of tests in this project.
-   **Component Tests**: Test Svelte components to ensure they render and behave as expected.
-   **Integration Tests**: Verify the interaction between different parts of the extension, such as message passing between the popup and the background script.

## How to Run Tests

For efficiency, tests are separated into two groups: main project tests and environment smoke tests.

### Main Tests

This is the command you will use most of the time during development. It runs all unit, component, and integration tests for the application, excluding the smoke tests.

```bash
npm run test
```

### Smoke Tests

This command runs only the tests in the `_vitest-check/` directory. Use this after installing or updating Vitest (or related packages) to ensure the test environment is configured correctly.

```bash
npm run test:smoke
```

## Directory Structure

- `components/`: Contains tests for Svelte components.
- `entrypoints/`: Contains tests for entrypoint scripts like `background.ts`.
- `utils/`: Contains tests for utility functions.
- `_vitest-check/`: Contains code to verify that the test environment works correctly after installing or updating Vitest.

```
root/
  |
  *-- tests/
       |
       *-- components/
       *-- entrypoints/
       *-- utils/
       *-- _vitest-check/
            |
            *-- components/
            |    |
            |    *-- Counter.svelte
            |    *-- Counter.test.ts
            |
            *-- utils/
                 |
                 *-- helpers.ts
                 *-- helpers.test.ts
```
