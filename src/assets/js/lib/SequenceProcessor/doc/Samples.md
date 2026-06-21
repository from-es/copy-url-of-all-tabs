# SequenceProcessor Implementation Samples

**Last Updated:** June 20, 2026

This document presents various implementation samples showing how to use `SequenceProcessor` for different use cases.

## 1. Basic Data Transformation

This is the simplest example, transforming a property in the data.

```typescript
import { SequenceProcessor } from "../lib/SequenceProcessor";
import { cloneObject } from "../lib/CloneObject";
import type { SequenceRule } from "../lib/SequenceProcessor/types";

type UserData   = { name: string; age: number; };
type AppContext = { timestamp: number; };

const rules: SequenceRule<UserData, AppContext>[] = [
	{
		meta: {
			name       : "UpperCaseName",
			description: { reason: "To unify the display format", target: "name", action: "Convert name to uppercase" }
		},
		process: {
			condition: ({ data }) => data.name !== data.name.toUpperCase(),
			execute  : ({ data }) => {
				const next = cloneObject(data);
				next.name = next.name.toUpperCase();
				return next;
			}
		}
	}
];

const processor = new SequenceProcessor<UserData, AppContext>(rules);
const result = await processor.process({ name: "alice", age: 20 }, { timestamp: Date.now() });
console.log(result.data.name); // "ALICE"
```

## 2. Platform and Version Dependent Processing

This example switches operations depending on the execution environment (Chrome/Firefox) or the application version.

### Notes

The `SequenceProcessor` library itself does not contain built-in features to auto-detect browser environments (e.g., presence of the `chrome` object) or versions. This is by design to keep it platform-agnostic. **The caller (the application side) is responsible for automatically determining the environment or generating the environment detection object, and injecting it via the `context` parameter (the second argument of `process()`)**.

### Rule Definition Example

```typescript
const rules: SequenceRule<Config, Context>[] = [
	{
		meta: {
			name       : "FirefoxSpecificFix",
			description: { reason: "Fix behavior that occurs only on Firefox", action: "Enable specific flag" }
		},
		spec: {
			platforms: ["firefox"],  // Run only when context.platform is "firefox"
			lifecycle: {
				introduced: "1.5.0",  // Apply starting from context.version 1.5.0
				obsoleted : "2.0.0"   // Skip starting from context.version 2.0.0 (obsoleted)
			}
		},
		process: {
			condition: () => true,
			execute  : ({ data }) => ({ ...data, firefoxFixApplied: true })
		}
	}
];
```

### Caller Example (Injecting Context)

```typescript
// 1. Caller determines the current environment or browser
const currentPlatform = typeof browser !== "undefined" ? "firefox" : "chrome";
const currentVersion  = "1.24.0";  // Dynamic version of the extension or app

// 2. Wrap results in a context object and pass it to the library
const context = {
	platform: currentPlatform,
	version : currentVersion,
	// Add additional external dependencies or states if needed
};

const result = await processor.process(currentData, context);
```

## 3. Error Handling and Rollback

This example controls whether to roll back the entire process or continue when a specific rule fails.

```typescript
const rules: SequenceRule<Data, Context>[] = [
	{
		meta   : { name: "CriticalUpdate", description: { reason: "Mandatory update" } },
		spec   : { critical: true },  // If this fails, the entire data is rolled back to the initial state
		process: {
			condition: () => true,
			execute  : () => { throw new Error("Critical error"); }
		}
	},
	{
		meta   : { name: "OptionalUpdate", description: { reason: "Optional update" } },
		spec   : { critical: false },  // If this fails, only changes from this rule are discarded and processing continues
		process: {
			condition: () => true,
			execute  : () => { throw new Error("Minor error"); }
		}
	}
];
```

## 4. Bulk Loading Rules with `import.meta.glob`

This is the recommended pattern to automatically load and run multiple rule files in a directory.

```typescript
// rules/index.ts
import { loadRules } from "../../lib/SequenceProcessor/loadRules";
import type { Config, Context } from "./types";

// Import all *.rule.ts inside the directory synchronously
const modules = import.meta.glob('./**/*.rule.ts', { eager: true });
export const allRules = loadRules<Config, Context>(modules);

// main.ts
import { SequenceProcessor } from "../lib/SequenceProcessor";
import { allRules } from "./rules";

const processor = new SequenceProcessor(allRules);
const result    = await processor.process(currentData, appContext);
```

## 5. Usage as Multi-Stage Validation

This example demonstrates using the library as a data integrity check pipeline rather than for transformations.

```typescript
type FormState = { email: string; acceptedTerms: boolean; };
const rules: SequenceRule<FormState, void>[] = [
	{
		meta: { name: "CheckEmail", description: { reason: "Format check" } },
		process: {
			condition: ({ data }) => !data.email.includes("@"),
			execute  : () => { throw new Error("Invalid Email"); }
		}
	},
	{
		meta: { name: "CheckTerms", description: { reason: "Terms acceptance check" } },
		process: {
			condition: ({ data }) => !data.acceptedTerms,
			execute  : () => { throw new Error("Terms not accepted"); }
		}
	}
];

// Set options.failFast = false to collect all validation errors at once
const result = await processor.process(formData, undefined, { failFast: false });
if (result.status === "failed") {
	console.log("Validation errors:", result.errors.map(e => e.error.message));
}
```

## 6. Sample Rule Set for Verification and Testing

This is a sample rule set for verifying the basic operations of the library (adding, deleting, overwriting, and moving properties, as well as conditional skipping). It provides three patterns: synchronous, asynchronous, and mixed.

**Note:** Thanks to internal asynchronous resolution control (sequential execution), these three patterns (synchronous, asynchronous, mixed) are guaranteed to **behave and yield exactly the same final processed object**. Select the implementation pattern that best suits your environment and requirements.

These samples are defined under `doc/code/` and can be used as a starting point for verifying operations during development.

### Rule Set Import and Execution Example

```typescript
import { SequenceProcessor } from "../lib/SequenceProcessor";
// Import the pattern you wish to verify
import { syncRules }  from "../lib/SequenceProcessor/doc/code/syncRules";
// import { asyncRules } from "../lib/SequenceProcessor/doc/code/asyncRules";
// import { mixedRules } from "../lib/SequenceProcessor/doc/code/mixedRules";

const processor = new SequenceProcessor(syncRules);

// Test data
const testData = {
	status     : "initial",
	toBeDeleted: "existing_value",
	oldLocation: "data_to_move"
};

// Execution (context can include version info and platform)
const result = await processor.process(testData, { version: "1.24.0", platform: "chrome" });

console.log(result.data);
/*
Expected output (the result is identical whichever you execute: syncRules, asyncRules, or mixedRules):
{
	status     : "updated",      // Successfully rewritten (statusAsync / statusMixed for async/mixed)
	addedProp  : "sync_value",   // Successfully added (addedPropAsync / addedPropMixed for async/mixed)
	newLocation: "data_to_move"  // Successfully moved (newLocationAsync / newLocationMixed for async/mixed)
	// toBeDeleted... has been deleted
	// skippedProp... does not exist (successfully skipped)
}
*/
```

---

This project is licensed under the MIT license. Please read the [LICENSE file](../../../../../../LICENSE.md "LICENSE file") for more information.
