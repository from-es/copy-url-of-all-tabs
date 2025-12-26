# About the `define` Module

**Last Updated:** December 26, 2025

## Overview

This document explains the purpose, structure, and responsibilities of the refactored `define` module.

## `define` Directory Structure and Responsibilities

The `define/` directory serves as the root for the refactored `define` module and contains the following files:

```
@project/src/
└── assets/js/
    └── define/
        ├── doc/
        │   ├── README.md          // Documentation.
        │   └── README.ja.md       // This document (Japanese version).
        │
        ├── index.ts               // Module entry point. Aggregates and exports all elements.
        ├── app.ts                 // Static information about the extension (Information, Storage, etc.).
        ├── config.ts              // Manages the default configuration object (Config).
        ├── constants.ts           // Various constants (numbers, strings, regular expressions, messages).
        ├── types.ts               // All type definitions for the module.
        └── validation.ts          // All validation logic.
```

## How to Add New Constants, Types, and Validation Rules

When adding new definitions, please follow these steps.

### Adding New Constants

1. **Identify the File**: Identify the appropriate file for the new constant.
	- `app.ts`: For static information related to the extension itself (e.g., manifest data).
	- `constants.ts`: For all other constants (e.g., numbers, strings, regular expressions, UI messages).
2. **Edit the File**: Add the constant to the identified file.
3. **Export**: Ensure the new constant is exported (e.g., `export const NEW_CONSTANT = "value";`).
4. **Use**: Import and use the constant from the corresponding file.

### Configuration Values When Adding New Features

When implementing new features, if user-modifiable configuration values need to be added, extend the `Config` object by following these steps:

1. **Add Type Definition (`types.ts`)**
	- Open `define/types.ts` and add the new configuration property and its type to the `Config` type (or its constituent parts, `Config_Common` or `Config_Delta`).
	- Example: To add a `NewFunc` setting to `Filtering`.
		```typescript
		// types.ts
		type Config_Delta = {
			Filtering: {
				// ... existing properties
				NewFunc: { // <- New setting group
					enable: boolean;
				};
			};
			// ...
		};
		```

2. **Add Default Value (`config.ts`)**
	- Open `define/config.ts` and add the default value for the new setting to the `defaultConfig` object. The structure added here must match the type defined in `types.ts`.
	- Example:
		```typescript
		// config.ts
		export const defaultConfig: Config = {
			// ...
			Filtering: {
				// ... existing properties
				NewFunc: { // <- Default value for the new setting
					enable: true
				}
			},
			// ...
		};
		```

3. **Add Validation Rule (`validation.ts`)**
	- Open `define/validation.ts` and add a validation rule for the new configuration property to the `VerificationRules` array.
	- A rule consists of three parts: `property` (path within the `Config` object), `fail` (fallback value on validation failure), and `rule` (validation logic).
	- Example:
		```typescript
		// validation.ts
		export const VerificationRules: VerificationRule[] = [
			// ... existing rules
			{
				property: "Filtering.NewFunc.enable",
				fail: () => { return defaultConfig.Filtering.NewFunc.enable; },
				rule: (value) => {
					return v8n().boolean().test(value);
				}
			},
		];
		```

4. **Add Related Constants (`constants.ts`)**
	- If the new setting depends on fixed values such as minimum/maximum values or specific string literals, define these values as constants in `define/constants.ts`.
	- This avoids magic numbers and improves code maintainability.

### Adding New Types

1. **Edit the File**: Add the new type definition to `define/types.ts`.
2. **Export**: Ensure the new type is exported from the file (e.g., `export type NewType = { ... };`).
3. **Use**: Import and use the type from `define/types.ts`.

### Adding New Validation Rules

1. **Edit the File**: Add the validation logic to `define/validation.ts`.
2. **Implementation**:
	- **Validation of Configuration Objects**: For rules that validate the `Config` object, add them to the `VerificationRules` array.
	- **Custom `v8n` Rules**: If you want to extend `v8n` with custom validation methods, call `v8n.extend()` at the beginning of the file.
3. **Use**: Rules in `VerificationRules` are automatically used. Custom `v8n` rules can be used within your validation logic.