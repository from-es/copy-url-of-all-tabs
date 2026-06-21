# SequenceRule Specification

**Last Updated:** June 20, 2026

## Overview

`SequenceRule<T, C>` is an object that defines an individual processing step executed by `SequenceProcessor`. It encapsulates the processing logic, metadata, and execution condition control in a single place.

## Structure of a Rule

```typescript
type SequenceRule<T, C> = {
	// Metadata. Used for display and debugging
	meta: SequenceMeta & { description: SequenceDescription };
	// Execution control. Specifies platforms and lifecycles
	spec?: SequenceSpec;
	// Core processing logic
	process: {
		condition: (arg: SequenceArgument<T, C>) => Promise<boolean> | boolean;
		execute  : (arg: SequenceArgument<T, C>) => Promise<T> | T;
	};
	// Order of application
	order?: number;
};
```

### `meta` (Required)

Information to help developers understand the purpose of the rule.
- `name`: A short name for the rule.
- `description.reason`: Why this processing is necessary.
- `description.target`: What is being modified.
- `description.action`: What operation is performed.

### `spec` (Optional)

Controls the execution environment and lifecycle of the rule.
- `enabled`: If set to `false`, the rule is completely ignored.
- `critical`: If `true`, a failure in this rule results in the failure of the entire process (initiating rollback). Defaults to `true`.
- `platforms`: Array of strings (e.g., `["chrome", "firefox"]`) specifying that the rule should run only on particular platforms.
- `lifecycle`: Controls execution based on the version.
  - `introduced` (string): **Introduction version**. The rule runs only if the environment version is equal to or higher than this value.
  - `obsoleted` (string): **Obsoletion version**. The rule is skipped if the environment version reaches or exceeds this value.

### `process` (Required)

- `condition`: `execute` runs only when this function returns `true`.
- `execute`: Transforms the data and returns a new data object.

## Implementation Example

Below is an example of a rule that renames an old property to a new one at a specific version.

```typescript
import { cloneObject } from "../../../../lib/CloneObject";
import type { SequenceRule } from "../../../../lib/SequenceProcessor/types";
import type { Config, Context } from "./types";

export const rules: SequenceRule<Config, Context>[] = [
	{
		meta: {
			name: "RenameOldProperty",
			author: "From E",
			description: {
				reason: "Rename oldProp to newProp to clarify the configuration name",
				target: "config.newProp",
				action: "If oldProp exists, transfer its value to newProp and delete oldProp"
			},
			authored: "2026-06-17"
		},
		spec: {
			critical: false, // Continue other processes even if this fails
			lifecycle: {
				introduced: "1.20.0"
			}
		},
		order: 10,
		process: {
			condition: ({ data }) => {
				return Object.hasOwn(data, "oldProp");
			},
			execute: ({ data }) => {
				const newData = cloneObject(data);
				newData.newProp = newData.oldProp;
				delete newData.oldProp;
				return newData;
			}
		}
	}
];
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
