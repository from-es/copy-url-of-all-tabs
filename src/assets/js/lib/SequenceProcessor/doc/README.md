# SequenceProcessor Library

**Last Updated:** June 20, 2026

## Overview

`SequenceProcessor` is a general-purpose library designed to sequentially apply a series of operations (rules) to a data object.

It runs multiple independent logics—such as data transformation, state updates, or step-by-step validation—in a specific order, providing integrated management of error handling and execution condition control throughout the process.

Designed with type-safe generics (`T`, `C`), it is highly flexible and compatible with any data structure and execution context.

## Key Features

1. **Sequential Execution:**
	- Applies registered rules sequentially according to their designated `order` (execution order).
2. **Advanced Filtering (Spec):**
	- Automatically filters rules at runtime based on execution platform, version (lifecycle), and enable/disable flags.
3. **Flexible Error Control:**
	- Allows setting whether a rule is "Critical" or not, letting you choose whether to continue processing upon an error or perform a complete rollback for safety.
4. **Context Injection:**
	- Pass a shared "Context (C)" to all rules, enabling decisions dependent on environment details or external state.
5. **Immutability Protection:**
	- Protects the input data by processing a clone created internally. It also features a rollback function when errors occur.

## Documentation

- **Specifications**
	- [SequenceProcessor.md](./SequenceProcessor.md): Core logic, execution process, and options.
	- [SequenceRule.md](./SequenceRule.md): Rule structure (meta, spec, process) and how to define them.
	- [loadRules.md](./loadRules.md): Specifications and validation of the rule loader utility.
- **Implementation Guide**
	- [Samples.md](./Samples.md): A collection of implementation samples from basic usage to advanced use cases.

## Directory Structure and Imports

The library and its rules assume the following directory structure. Code blocks within this documentation use relative paths for imports based on this layout.

```text
src/
└── assets/
    └── js/
        ├── app/
        │   └── SequenceProcessor/
        │       ├── context.ts
        │       ├── types.ts
        │       └── rules/
        │           ├── index.ts              (Import source: ../../lib/SequenceProcessor/loadRules)
        │           └── migrate/
        │               └── v1.rules.ts       (Import source: ../../../../lib/SequenceProcessor/types)
        └── lib/
            ├── CloneObject.ts
            └── SequenceProcessor/
                ├── index.ts                  (Library core)
                ├── loadRules.ts
                ├── types.ts
                └── MigrationManager.ts
```

## License

This project is released under the [MIT License](../../../../../../LICENSE.md).
