# MigrationManager Library

**Last Updated:** December 3, 2025

## Overview

`MigrationManager` is a library for safely converting (migrating) older versions of data objects (such as settings) to the latest format.

It plays a role in absorbing updates that could break backward compatibility, such as changes in data structure or property names accompanying application version upgrades, thereby maintaining application stability and maintainability.

With the `MigrationManager` class at its core, it injects "migration rules" from the outside to migrate any data structure safely and robustly.

## Main Features

1.  **Class-Based Design:**
    - `MigrationManager` encapsulates the migration logic, providing a reusable design.
2.  **Dependency Injection (DI):**
    - By injecting migration rules from the outside, it separates the core logic from the rules, achieving high flexibility.
3.  **Synchronous and Bulk Rule Loading:**
    - With `import.meta.glob` and the `loadRules` utility, multiple rule files can be imported and managed in bulk **synchronously**.
    - > [!WARNING] In the Service Worker environment of a Chrome extension, dynamic module imports do not work, so specifying synchronous loading (`{ eager: true }`) is mandatory.
4.  **Versatility and Asynchronous Support:**
    - Generics `<T>` allow it to support the migration of diverse data structures.
    - `async/await` can be used in the `condition` or `execute` functions within the rules, but **dynamic import of the rule modules themselves is not supported in a Service Worker environment.**
5.  **Safety and Consistency:**
    - The migration process is executed transactionally, and changes are rolled back if an error occurs. If the entire process fails, it returns the initial data from before the migration started, not partially modified data.
6.  **Robust Error Handling:**
    - Even if an error occurs in an individual rule, the process does not stop; it generates a detailed error report.
7.  **History Tracking:**
    - It records the applied rules, facilitating debugging and validation.

## Documentation

For more detailed specifications and operational policies, please refer to the following documents.

- **Specifications**
	- [MigrationManager.md](./MigrationManager.md): About the design philosophy, execution process, and basic usage of `MigrationManager`.
	- [MigrationRule.md](./MigrationRule.md): About the detailed definition method of migration rules.
	- [loadRules.md](./loadRules.md): About the specifications of the rule loader utility `loadRules` and **important constraints in the Service Worker environment**.
- **Operational Policy**
	- [RuleManagementPolicy.md](./RuleManagementPolicy.md): About the lifecycle management policy for migration rules.
