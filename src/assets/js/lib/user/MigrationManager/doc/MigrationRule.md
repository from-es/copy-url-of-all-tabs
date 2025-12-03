# Migration Rule Specifications

**Last Updated:** December 3, 2025

## Overview

This document defines the structure of the migration rule objects used by `MigrationManager` and the role of each property. Rules are essential for following schema changes in data and safely migrating data from older versions to newer ones.

## Basic Structure of a Rule

Each migration rule must be an object that conforms to the `MigrationRule<T>` type. `T` is a generic type indicating the data type to be migrated (e.g., `Config`).

```typescript
// Type definition for an individual migration rule
type MigrationRule<T> = {
	// Metadata for the rule. Not required, but strongly recommended for maintenance.
	meta?: MigrationRuleMeta;
	// A number that defines the application order of the rule (optional). Executed in ascending order.
	order?: number;
	// A function to determine if this rule should be applied.
	condition: (argument: MigrationArgument<T>) => boolean | Promise<boolean>;
	// A function that executes the actual migration process.
	execute: (argument: MigrationArgument<T>) => T | Promise<T>;
};

// Type definition for rule metadata
type MigrationRuleMeta = {
	author  : string; // The creator of the rule
	reason  : string; // An explanation of why this rule is necessary
	target  : string; // The property or feature being changed
	action  : string; // A description of the action the rule performs
	authored: string; // The date the rule was authored (for developer reference).
	version : {
		introduced: string;        // The version that necessitated this rule (i.e., when the new config structure was introduced).
		obsoleted : string | null; // The version at which this rule is considered obsolete and can be archived.
	};
};

// Type definition for arguments passed to condition/execute
type MigrationArgument<T> = {
	data: T; // The current data being migrated
	defaultValues: Partial<T>; // An object containing default values
};
```

## Detailed Description of Each Property

### `meta`

- **Type:** `MigrationRuleMeta` (optional)
- **Description:** Metadata for developers to understand the purpose and background of the rule. **This property is optional but strongly recommended to improve debugging and maintainability.** The properties within this object do not affect the logic of the migration process.
- **Properties:**
	- `author` (string): The name of the rule's creator.
	- `reason` (string): The background or reason why this rule became necessary (e.g., "To support the settings structure change in v1.11.0").
	- `target` (string): The property path or feature name of the data being changed (e.g., `config.Filtering`).
	- `action` (string): A specific description of what this rule does (e.g., "Adds the `Deduplicate` property to `config.Filtering`").
	- `authored` (string): The date the rule was authored (`YYYY-MM-DD`). Used as a reference for developers.
	- `version.introduced` (string): **The primary key for lifecycle management.** Accurately records the **version that necessitated this rule** (i.e., the version where the new configuration structure was introduced).
	- `version.obsoleted` (string | null): The **first version at which this rule is considered obsolete** and can be archived. Determined during the stocktaking process; `null` initially.

### `order`

- **Type:** `number` (optional)
- **Description:** A number to control the application order of the rules.
	- Rules are sorted and executed in **ascending order (smallest first)** based on the `order` value.
	- If `order` values are duplicated, the `loadRules` utility will throw an error.
	- Rules that omit this property are executed after all rules that have an `order`.

### `condition`

- **Type:** `(argument: MigrationArgument<T>) => boolean | Promise<boolean>`
- **Description:** A function to determine whether to execute the `execute` method.
	- If it returns `true`, the migration is considered necessary, and `execute` is called.
	- If it returns `false`, the data is considered to be in the latest state, and nothing is done.
	- It is also possible to have judgments involving asynchronous processing (e.g., querying a database).

### `execute`

- **Type:** `(argument: MigrationArgument<T>) => T | Promise<T>`
- **Description:** A function that performs the actual migration process.
	- It needs to modify the `data` passed as an argument and return the new, migrated data object.
	- **Note:** It is strongly recommended to create a deep copy of the original `data` object before making changes, rather than modifying it directly. This prevents unintended side effects.
	- You can refer to `defaultValues` to set initial values for new properties.
	- Migrations involving asynchronous processing (e.g., fetching data from an API) are also possible.

## Implementation Sample

Here is an example of a migration rule for when the `Badge` property was added to the `config` object in v1.12.0.

```typescript
import { cloneObject } from "@/assets/js/lib/user/CloneObject";
import type { MigrationRule } from "./types";
import type { Config } from "@/assets/js/types";

export const rules: MigrationRule<Config>[] = [
	{
		meta: {
			author : "Your Name",
			reason : "To add support for the badge feature on the extension icon, introduced in v1.12.0.",
			target : "config.Badge",
			action : "If the Badge property does not exist in the config object, add the default value.",
			authored: "2025-11-10",
		version: {
			introduced: "1.12.0",
			obsoleted : null
		}
		},
		order: 8,
		condition: ({ data }) => {
			// Returns true if the Badge property does not exist in data (config)
			return !Object.hasOwn(data, "Badge");
		},
		execute: ({ data, defaultValues }) => {
			// Create a copy of the data
			const newData = cloneObject(data);

			// Get the default settings for Badge from defaultValues and add them
			// Since defaultValues is also an object, copy it just in case
			newData.Badge = cloneObject(defaultValues.Badge);

			console.log('Migrated: Added "config.Badge"', newData);

			// Return the modified data
			return newData;
		}
	}
];
```
