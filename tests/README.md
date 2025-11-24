# Tests

This directory contains all the automated tests for the "Copy URL of All Tabs" extension.

## About

We use [Vitest](https://vitest.dev/) as our testing framework. The primary goal of these tests is to ensure the reliability and correctness of the extension's logic.

Tests are categorized as follows:

-   **Unit Tests**: Verify the functionality of individual functions and modules in isolation. These are the most common type of tests in this project.
-   **Component Tests**: Test Svelte components to ensure they render and behave as expected.
-   **Integration Tests**: Verify the interaction between different parts of the extension, such as message passing between the popup and the background script.

### Directory Categorization Principles
The test files are organized into directories based on the type and nature of the code being tested, mirroring the source code structure:

-   **`lib/`**: Contains tests for core application logic, domain-specific modules, or wrappers for external services/APIs. These often involve more complex interactions or business rules.
-   **`utils/`**: Contains tests for standalone, generic helper functions that perform specific, often application-agnostic, tasks. These functions typically do not hold significant application state or complex domain logic.
-   **`components/`**: Contains tests for Svelte components.
-   **`entrypoints/`**: Contains tests for entrypoint scripts.
-   **`_vitest-check/`**: Contains tests specifically designed to verify that the test environment itself is configured and functioning correctly.

## How to Run Tests

For efficiency, tests are separated into two groups: main project tests and environment smoke tests.

### Main Tests

This is the command you will use most of the time during development. It runs all unit, component, and integration tests for the application, excluding the smoke tests.

```bash
npm run vitest
```

### Smoke Tests

This command runs only the tests in the `_vitest-check/` directory. Use this after installing or updating Vitest (or related packages) to ensure the test environment is configured correctly.

```bash
npm run vitest:smoke
```

## Directory Structure

- `components/`: Contains tests for Svelte components.
- `entrypoints/`: Contains tests for entrypoint scripts.
- `lib`: Contains tests for library functions.
- `utils/`: Contains tests for utility functions.
- `_vitest-check/`: Contains code to verify that the test environment works correctly after installing or updating Vitest.

```
root/
  |
  *-- tests/
       |
       *-- components/
       |    └─ SomeComponent.test.ts
       *-- entrypoints/
       |    └─ background
       |        └─ index.test.ts
       *-- lib/
       *-- utils/
       *-- _vitest-check/
            |
            *-- components/
            |    └─ Counter.test.ts
            *-- utils/
                 └─ helpers.test.ts
```
