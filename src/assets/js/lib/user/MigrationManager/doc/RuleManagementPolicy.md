# Migration Rule Management Policy

**Last Updated:** December 3, 2025

## Overview

This document defines the lifecycle (addition, review, archiving) of migration rules used in the `MigrationManager` module and the operational policies according to the type of data being migrated. The purpose of this policy is to prevent the bloating of rules and to maintain the long-term maintainability of the codebase.

## Basic Policy

- **Clarification of Lifecycle:** Rules must not only be easy to add but also be safely removable in the future. To achieve this, the lifecycle of each rule is **managed on a version basis**.
- **Limitation of Support Scope:** The codebase will, as a principle, only maintain the migration paths for currently supported versions.

## Rule Metadata Structure

Each rule must have a `meta` object to manage its role and lifecycle.

> [!TIP]
> Properties within the `meta` object are not mandatory for the code to run. However, **their description is strongly recommended for proper rule management, debugging, and future maintenance.**

-   **`meta` Object Structure Example:**
	```typescript
	meta: {
		author  : "From E",
		reason  : "To add settings for the badge feature introduced in v1.12.0",
		target  : "config.Badge",
		action  : "If config.Badge does not exist, apply default values",
		authored: "2025-11-10", // Authored date (for developer reference)
		version: {
			introduced: "1.12.0",   // The version that necessitated this rule
			obsoleted : null         // The version at which this rule is considered obsolete (initially null)
		}
	}
	```

- **Description of Each Property:**
	- `author` (string): The name or alias of the rule's creator.
	- `reason` (string): The reason this rule became necessary (e.g., corresponding feature change, bug fix).
	- `target` (string): The property path of the setting to be migrated.
	- `action` (string): A concise description of the process the rule executes.
	- `authored` (string): The date the rule was authored (`YYYY-MM-DD`). Used as a reference for developers.
	- `version.introduced` (string): **The primary key for lifecycle management.** Accurately records the **version that necessitated this rule** (i.e., the version where the new configuration structure was introduced).
	- `version.obsoleted` (string | null): The **first version at which this rule is considered obsolete** and can be archived. Determined during the stocktaking process; `null` initially.

## Considerations Based on the Storage Location of Migrated Data

The `MigrationManager` library is expected to handle data stored mainly in two ways.

### Case 1: Internal Storage via `chrome.storage` API (Standard)

This is the standard operation for this extension. The user's settings are saved in `chrome.storage.local` under the key `config`.

- **Architecture:**
	- Data migration is automatically handled by the `initializeConfig.ts` module.
	- At extension startup, `StorageManager` reads the settings data from `chrome.storage.local`.
	- The read data is passed to `MigrationManager`, where all necessary migrations are applied based on predefined rules.
	- If a migration is executed and succeeds, the updated settings object is automatically re-saved to `chrome.storage.local` through `StorageManager`.
- **Operational Considerations:**
	- In this case, users do not need to be aware of version differences. The migration is performed transparently.
	- Rules are primarily intended to be applied incrementally for small changes added with each minor version update.

### Case 2: External Storage as a Settings File (e.g., Import/Export Feature)

This case assumes that a user exports settings as a file (e.g., JSON) and later imports them.

- **Scenarios:**
	1.  **Settings Structure Change:** When importing an old settings file that was exported into a new version of the extension. Schema inconsistencies such as property additions, deletions, or name changes can occur.
	2.  **Spanning Major Versions:** In particular, migrations that jump across multiple major versions, such as importing settings exported from a v1 series extension into a v3 series extension, may be necessary.
- **Operational Considerations:**
	- `MigrationManager` is designed to handle such scenarios.
	- What is important is to correctly implement the logic on the calling side (e.g., the implementation of the import feature) to cumulatively apply the migration rules corresponding to each major version, following the **"Versioning Strategy for Rule Aggregation Files."**
	- For example, to migrate v1 data to v3, you must apply the `v1 -> v2` rule set and the `v2 -> v3` rule set in sequence. This allows data to be safely brought up to the latest state even with large version gaps.

## Versioning Strategy for Rule Aggregation Files

To prevent the mixing of migration logic for different major versions (v1, v2, ...), the unit of rule aggregation will be divided by major version.

### Purpose

- To physically and clearly separate the migration logic between different major versions.
- To allow the application to cleanly import only the rule sets for the required versions.

### Operational Rules

For each major version, create an entry point file that aggregates the rules for that version series.

-   **File Placement Example:**
	```
	src/assets/js/lib/user/MigrationManager/rules/
	 ├─ v1/
	 │   ├─ v1.11.0-restructure-filtering.rule.ts
	 │   └─ v1.12.0-add-badge-property.rule.ts
	 ├─ v2/
	 │   └─ ...
	 ├─ v1.rules.ts  // Aggregation file for v1 series rules
	 └─ v2.rules.ts  // Aggregation file for v2 series rules
	```

- **Implementation Example of an Aggregation File (`v1.rules.ts`):**
	```typescript
	import { loadRules } from "@/assets/js/lib/user/MigrationManager/loadRules";
	import type { Config } from "@/assets/js/types";

	const modules = import.meta.glob('./v1/**/*.rule.ts', { eager: true });
	// loadRules is a synchronous function and does not return a Promise
	export const migrationRules = loadRules<Config>(modules);
	```

### Implementation Image on the Calling Side (Handling Spanning Major Versions)

The application side determines the version of the data to be migrated and applies the appropriate version's rule sets in stages.

> [!WARNING]
> **Prohibition of Dynamic Imports in Service Worker Environment**
> Dynamic imports using `await import(...)` like in the sample code below **cannot be used** in a Service Worker environment because they cause a `window is not defined` error. This method is only valid in normal web page contexts where the `window` object is available, such as an options page.

#### Not Recommended: Implementation with Dynamic Imports (Does not work in Service Worker)

```typescript
// [...(previous code)]
// The following code will not work in a Service Worker
async function migrateExternalData(data: Config, defaultValues: Partial<Config>) {
	// [...(version checks, etc.)]

	// Use switch-case fall-through to concatenate rules from old versions in stages
	switch (dataVersion) {
		case 1:
			// Dynamic import will cause an error in Service Worker
			const { migrationRules: rulesV1 } = await import('@/assets/js/lib/user/MigrationManager/rules/v1.rules.ts');
			combinedRules = combinedRules.concat(rulesV1);
			// fall through
		case 2:
			const { migrationRules: rulesV2 } = await import('@/assets/js/lib/user/MigrationManager/rules/v2.rules.ts');
			combinedRules = combinedRules.concat(rulesV2);
			// fall through
		// When a new version (v3) is added, add case 3 here
	}
	// [...(subsequent code)]
}
```

#### Recommended: Implementation with Static Imports (Service Worker Compatible)

To operate safely in all environments, including Service Workers, all necessary rule aggregation files should be imported **statically**. By using the `fall-through` of a `switch-case` statement, the logic to guarantee all migration paths from old versions to the latest version can be similarly realized.

```typescript
import { MigrationManager } from "@/assets/js/lib/user/MigrationManager";
import type { MigrationRule } from "@/assets/js/lib/user/MigrationManager/types";
import type { Config } from "@/assets/js/types";

// --- Statically import all necessary rule aggregation files ---
import { migrationRules as rulesV1 } from "@/assets/js/lib/user/MigrationManager/rules/v1.rules.ts";
import { migrationRules as rulesV2 } from "@/assets/js/lib/user/MigrationManager/rules/v2.rules.ts";
// import { migrationRules as rulesV3 } from "@/assets/js/lib/user/MigrationManager/rules/v3.rules.ts";

const LATEST_VERSION = 2; // The latest major version supported by the application (change to 3 when v3 is ready)

async function migrateExternalData(data: Config, defaultValues: Partial<Config>) {
	const dataVersion = detectDataVersion(data); // Determine the major version from the data
	let combinedRules: MigrationRule<Config>[] = [];

	if (dataVersion >= LATEST_VERSION || dataVersion < 1) {
		return data; // No migration needed, or do not process for invalid versions
	}

	// Use switch-case fall-through to concatenate rules from old versions in stages
	switch (dataVersion) {
		case 1:
			combinedRules = combinedRules.concat(rulesV1);
			// fall through
		case 2:
			combinedRules = combinedRules.concat(rulesV2);
			// fall through
		// When a new version (v3) is added, add case 3 and the import for v3 here
	}

	const manager = new MigrationManager<Config>(combinedRules);
	const result = await manager.migrate(data, defaultValues);

	// Error handling, etc.
	if (result.hasError) {
		console.error("Failed to migrate external settings.", result.errorReports);
	}

	return result.data;
}
```

## Review and Archiving of Migration Rules

A manual review and archiving process will be implemented based on a **version-based lifecycle**.

### 1. Triggers for Review

- **At Major Version Upgrade planning:** When planning the release of a new major version (e.g., v3.0.0).
- **Periodic Reviews:** Once every six months or a year to review the current rule set.

### 2. Archiving Criteria

1.  **Determine Supported Versions:**
    - First, decide on the **oldest version** to be supported in the next major version (e.g., "In v3.0.0, we will only support migrations from v2.5.0 and later").

2.  **Identify Archiving Targets:**
    - Rules where the `meta.version.introduced` value is **older than the minimum supported version** determined above become candidates for archiving.
	- (e.g., If the minimum supported version is `v2.5.0`, all rules with `introduced` as `"2.4.0"` or `"1.12.0"` are targeted.)

### 3. Archiving Process

1.  **Update `obsoleted`:**
    - For each rule targeted for archiving, record the version in which it was decided to be obsolete (e.g., `"3.0.0"`) in the `meta.version.obsoleted` field.
2.  **Move Files:**
    - Move the target rule files (`*.rule.ts`) from the `rules` directory to another location, such as `rules/archives`. This excludes them from the build.
3.  **Ensure Traceability:**
    - Do not physically delete the files; keep them under Git control so that the history of changes can be tracked at any time.
4.  **Update Aggregation Files:**
    - If there are any rule aggregation files (e.g., `v2.rules.ts`) affected by the archiving, modify them accordingly, such as by reviewing the path for `import.meta.glob`.
