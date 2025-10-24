# MigrateConfig

A utility designed to safely convert (migrate) older versions of a configuration object to the latest format. It plays a crucial role in maintaining application stability by absorbing breaking changes, such as modifications to the configuration structure or property names.

---

## Overview

As an application evolves, its configuration (`config`) structure may change. For example, property names might be renamed, or new settings added. `MigrateConfig` provides a core mechanism to define and execute a series of "migration rules" to handle such changes.

This module takes the current configuration object and a default configuration (`define`), then evaluates and applies a predefined set of migration rules sequentially. Each rule is executed only if it meets a specific condition (e.g., "does the old property exist?"), safely modifying the configuration object. It operates on a deep copy, so the original configuration object is never altered, eliminating concerns about side effects.

## Minimum Requirements

This module operates correctly on browsers that support native `Object.hasOwn()` (Chrome 93+, Firefox 92+).

## Key Features

- **Safe Migration:** Operates on a deep copy of the configuration object to prevent destruction of the original data.
- **Rule-Based Migration:** Migration logic is defined in individual, independent "rules," making them easy to add or remove.
- **Conditional Execution:** Each rule has a `condition` function, and the migration logic (`execute`) is only run if this condition is met.
- **Robust Error Handling:** If an error occurs during the execution of a specific rule, the entire process does not halt. The error is logged to the console, and that rule is skipped.
- **Applied History Tracking:** Records which migration rules were applied and which resulted in errors, returning this information to facilitate debugging and verification.

## Design Philosophy

### Defining Migration Rules

The core of `MigrateConfig` is the `migrationRules` array defined in `rules.ts`. Each rule consists of three main components:

- **`rules` (Metadata):**
  - An object describing the reason for the migration, the target, and the changes to be made. This information is used for debugging and documentation and does not affect the actual process.
  - See `MigrationRuleDefinition.md` for more details.

- **`condition(argument)` (Condition Function):**
  - A function that determines whether the migration should be executed. It takes `config` and `define` as arguments and returns a `boolean` value.
  - For example, it might check if a property like `enable` exists on `config.Filtering`.

- **`execute(argument)` (Execution Function):**
  - The body of the migration logic, which is only executed if `condition` returns `true`.
  - Like `condition`, it receives `{ config, define }` as an argument.
  - It modifies the `config` object, transforming it to the new structure, and must return the modified `config` object.

This design ensures that each piece of migration logic is self-contained and functions independently of other rules. When a new configuration change is needed, you can simply add a new rule object to the `migrationRules` array.

### Execution Process

When the `migrateConfig` function is called, it follows these steps:

1.  **Deep Copy:** It creates a deep copy of the input `config` and `define` objects to protect the originals.
2.  **Rule Iteration:** It sequentially evaluates each rule in the `migrationRules` array.
3.  **Condition Evaluation:** For each rule, it runs the `condition` function to determine if a migration is necessary.
4.  **Migration Execution:** If `condition` returns `true`, it runs the `execute` function to modify the configuration object.
5.  **Result Aggregation:** After all rules have been evaluated, it returns an object containing:
    - `isSucceeded`: Whether all migration processes completed without any errors.
    - `isExecuted`: Whether any rule was executed.
    - `hasError`: Whether an error occurred during the migration process.
    - `appliedRules`: An array of metadata for the applied rules.
    - `errorReports`: An array of detailed information about any errors that occurred.
    - `config`: The final, migrated configuration object.

## Basic Usage

`migrateConfig` is intended to be used during application startup or when loading settings.

```typescript
import { migrateConfig } from './MigrateConfig';
import { defaultConfig } from './path/to/defaultConfig'; // Default settings
import { userConfig } from './path/to/userConfig';     // User-saved settings

// Migrate the user's settings
const result = migrateConfig(userConfig, defaultConfig);

if (result.isExecuted) {
  if (result.hasError) {
    console.error("An error occurred during configuration migration:", result.errorReports);
  } else {
    console.log("Configuration was migrated. Applied rules:", result.appliedRules);
    // Save the migrated configuration, etc.
    saveConfig(result.config);
  }
} else {
  console.log("Configuration migration was not needed.");
}
```

## API Reference

### `migrateConfig(config, define)`

Takes a configuration object and performs transformations based on the defined migration rules.

- **Arguments**:
  - **`config: Config`**: The user-saved or older version of the configuration object.
  - **`define: Define`**: The application's latest default configuration object, used to reference default values for new properties.

- **Returns**: A `MigrationResult` object:
  - **`isSucceeded: boolean`**: `true` if all migration processes completed without errors.
  - **`isExecuted: boolean`**: `true` if at least one migration rule was executed.
  - **`hasError: boolean`**: `true` if one or more errors occurred during the migration process.
  - **`appliedRules: object[]`**: An array containing the `rules` metadata for each applied rule.
  - **`errorReports: object[]`**: An array of error information. Each element contains the rule in question, the error object, and the configuration at that point.
  - **`config: Config`**: The final configuration object after migrations have been applied.

## References

- [MigrationRuleDefinition.md](./MigrationRuleDefinition.md) - For details on how to define migration rules.

## License

This project is licensed under the [MIT License](../../../../../../../LICENSE.md).
