# Tests Directory

**Last Updated:** April 21, 2026

This directory contains the automated test suite for the project. For detailed guidelines on how to write tests, design patterns (AAA, Data-Driven), and standard templates, please refer to the [Vitest Developer Guide](../docs/DeveloperGuide/vitest.md).

---

## 📁 Directory Structure

The test suite is organized logically according to the source code structure and shared infrastructure needs:

- **`lib/`**: Tests for core application logic and domain-specific modules.
- **`utils/`**: Tests for standalone, generic helper functions.
- **`shared/`**:
    - **`support/`**: Shared test infrastructure (e.g., `TestRunner.ts`, `setup.ts`).
    - **`fixtures/`**: Test data (JSON) and factory functions.
- **`_vitest-check/`**: Environment smoke tests (validates Vitest config/setup).
- **`components/`**: (Planned) Tests for Svelte components.
- **`entrypoints/`**: (Planned) Tests for extension entrypoint scripts.

---

## 🚀 Running Tests

We provide scripts for both continuous development and one-off verification.

### Project Functional Tests
These commands run all tests in the application, excluding environmental smoke tests.

```bash
# Run all tests once
npm run vitest:run

# Run in watch mode (recommended for active development)
npm run vitest

# Open the Vitest UI
npm run vitest:ui

# Generate coverage reports
npm run vitest:coverage
```

### Environment Smoke Tests
Use this command to verify that the Vitest environment is configured correctly (e.g., after updating dependencies).

```bash
npm run vitest:smoke
```

---

## 📝 Writing Standards
All new tests **must** follow the project standards:
1.  **Pattern**: Use the **AAA (Arrange-Act-Assert)** pattern.
2.  **Logic**: Prefer **Data-Driven Testing** using the common `TestRunner`.
3.  **Template**: Start from the **Master Test Template** found in the [Developer Guide](../docs/DeveloperGuide/vitest.md).