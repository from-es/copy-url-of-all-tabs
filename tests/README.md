# Tests

**Last Updated:** April 6, 2026

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
-   **`components/`**: Contains tests for Svelte components. *(Planned / Not yet implemented)*
-   **`entrypoints/`**: Contains tests for entrypoint scripts. *(Planned / Not yet implemented)*
-   **`_vitest-check/`**: Contains tests specifically designed to verify that the test environment itself is configured and functioning correctly.

## How to Run Tests

For efficiency, tests are separated into two groups: main project tests and environment smoke tests.

### Main Tests

This is the command you will use most of the time during development. It runs all unit, component, and integration tests for the application, excluding the smoke tests.

```bash
# Run all tests once (CI / pre-commit)
npm run vitest:run

# Watch mode — re-runs relevant tests on file change (during active development)
npm run vitest
```

### Smoke Tests

This command runs only the tests in the `_vitest-check/` directory. Use this after installing or updating Vitest (or related packages) to ensure the test environment is configured correctly.

```bash
npm run vitest:smoke
```

> **Why does this command use `--config vitest.smoke.config.ts`?**
> The `tests/_vitest-check/` directory is listed in the `exclude` of `vitest.config.ts`, which is used by all other test commands.
> Vitest's `--exclude` CLI option *appends to* rather than overrides the config's exclude list, so a path filter alone cannot reach the smoke tests.
> Using a dedicated `vitest.smoke.config.ts` — which only defines the smoke test `include` pattern with no conflicting `exclude` — is the clean solution.

## Test Configuration Files

Two Vitest configuration files exist at the project root to handle separate test execution scenarios:

| File | Used by | Purpose |
| :--- | :------ | :------ |
| `vitest.config.ts` | `vitest`, `vitest:run`, `vitest:ui`, `vitest:coverage` | Main test config. Includes `src/` and `tests/` (excluding `_vitest-check/`). |
| `vitest.smoke.config.ts` | `vitest:smoke` | Smoke test config. Includes `tests/_vitest-check/` only, with no conflicting exclude rules. |

## Directory Structure

- `components/`: Contains tests for Svelte components. *(Planned / Not yet implemented)*
- `entrypoints/`: Contains tests for entrypoint scripts. *(Planned / Not yet implemented)*
- `lib`: Contains tests for library functions.
- `utils/`: Contains tests for utility functions.
- `_vitest-check/`: Contains code to verify that the test environment works correctly after installing or updating Vitest.

```
root/
  |
  *-- vitest.config.ts           <- Main config (excludes _vitest-check/)
  *-- vitest.smoke.config.ts     <- Smoke-only config (includes _vitest-check/ only)
  *-- tests/
       |
       *-- components/          (Planned / Not yet implemented)
       |    └─ SomeComponent.test.ts
       *-- entrypoints/          (Planned / Not yet implemented)
       |    └─ background
       |        └─ index.test.ts
       *-- lib/
       *-- utils/
       *-- _vitest-check/         <- Run separately via vitest:smoke
            |
            *-- components/
            |    └─ Counter.test.ts
            *-- utils/
                 └─ helpers.test.ts
```