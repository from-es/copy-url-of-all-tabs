# MigrationManager Specifications

**Last Updated:** December 3, 2025

The `MigrationManager` library manages and executes data object migration processes, with the `MigrationManager` class at its core.

## Design Philosophy

### Architecture

The `MigrationManager` module consists of the following main components:

1.  **`MigrationManager<T>` Class:**
    - The core class for migration logic. It receives a sorted set of migration rules in its constructor and executes the actual data migration through the `migrate` method.
    - Generics `<T>` allow it to handle various data types.

2.  **Migration Rule Files (`*.rule.ts`):**
    - Files that encapsulate individual migration logic. Each file exports an array of type `MigrationRule<T>`.
    - Rules can be imported in several ways depending on the use case.
        - **Direct Import (Single File):**
            A method to directly load a specific rule file using `import`.
            ```typescript
            import { rules as yourRules } from './path/to/your-rule.rule.ts';

            // const manager = new MigrationManager(yourRules);
            ```
            This method is effective for a small number of rules or when you want to strictly apply only specific rules, but it lacks flexibility for efficiently managing multiple rules, so the following method is generally recommended.

        - **Bulk Import with `import.meta.glob` (Recommended):**
            By using `import.meta.glob` to import multiple rule files at once and passing them to the `loadRules` utility described below, you can efficiently build a rule set.
            ```typescript
            const modules = import.meta.glob('./rules/**/*.rule.ts', { eager: true });
            // const migrationRules = loadRules(modules); // loadRules is a synchronous function
            ```
    - For detailed rule definition methods, refer to [`MigrationRule.md`](./MigrationRule.md).

3.  **`loadRules<T>` Utility:**
    - Takes a module map **synchronously** loaded by `import.meta.glob`, validates its contents, and returns an array of `MigrationRule<T>` sorted based on the `order` property.
    - It detects invalid rules or duplicate `order` values and throws an error immediately (Fail-Fast), allowing for early discovery of development-time issues.

### Execution Process (How the `migrate` method works)

When the `migrate` method of `MigrationManager` is called, the process is executed in the following steps:

1.  **State Initialization:** Creates deep copies of the input `data` and `defaultValues` to initialize the migration execution state. The original objects are protected.
2.  **Rule Iteration:** Iterates through the migration rule array provided in the constructor in sequence.
3.  **Rule Application:** The `#applyRule` method is called for each rule.
    - Executes the `condition` function to determine if migration is necessary.
    - If `condition` returns `true`, it executes the `execute` function to modify the data.
    - If an error occurs during the execution of `execute`, the changes made by that rule are rolled back, and the error is reported.
    - If the rule is applied, its `meta` information is added to the `appliedRules` list.
4.  **Result Construction:** After all rules have been evaluated, the `#buildResult` method is called to construct and return a `MigrationResult<T>` object containing the following information:
    - `isSucceeded`: Whether all migration processes completed without errors.
    - `isExecuted`: Whether any rule was executed.
    - `hasError`: Whether an error occurred during the migration process.
    - `appliedRules`: An array of metadata for the applied rules.
    - `errorReports`: An array of detailed information about any errors that occurred.
    - `data`: The migrated data object, or the initial data if the process failed.

## Basic Usage

The `MigrationManager` module is intended to be used during application startup or when loading settings.

```typescript
// --- Import necessary modules ---
import { MigrationManager } from '@/assets/js/lib/user/MigrationManager';
import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules'; // If using the loadRules utility
import type { MigrationRule } from '@/assets/js/lib/user/MigrationManager/types';
import type { Config } from '@/assets/js/types';

/**
 * Receives configuration data and applies migration processing as needed.
 * @param data - User settings loaded from chrome.storage or default settings.
 * @param defaultValues - The latest application-defined default settings.
 * @returns The migrated configuration data.
 */
async function applyMigration(data: Config, defaultValues: Partial<Config>): Promise<Config> {
	const dataVersion = detectDataVersion(data); // Determine the major version from the data
	const LATEST_VERSION = 2; // The latest major version supported by the application (a hypothetical value here)
	let combinedRules: MigrationRule<Config>[] = [];

	if (dataVersion >= LATEST_VERSION || dataVersion < 1) {
		console.log(`Settings migration was not necessary (version: ${dataVersion} >= latest version: ${LATEST_VERSION}).`);
		return data; // No migration needed, or do not process for invalid versions
	}

	// --- Example of loading migration rules ---
	// The following shows two examples of how to load rules.
	// Choose the appropriate method according to your application's requirements.

	// Example 1: Direct Import (for importing specific rule files individually)
	// This method is suitable for strictly managing a small number of rules.
	// import { migrationRules as rulesV1 } from '@/assets/js/lib/user/MigrationManager/rules/v1/someRule.rule.ts';
	// combinedRules = rulesV1; // or combinedRules.concat(rulesV1);

	// Example 2: Import using `import.meta.glob` and the `loadRules` utility (Recommended)
	// Recommended for batch loading and combining multiple rule files using pattern matching.
	try {
		// For example, dynamically loading rules based on the data version
		if (dataVersion === 1) {
			const ruleModulesV1 = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/v1/*.rule.ts', { eager: true });
			combinedRules = loadRules<Config>(ruleModulesV1);
		}
		// If a new version (v2) exists, add it similarly
		// else if (dataVersion === 2) {
		//     const ruleModulesV2 = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/v2/*.rule.ts', { eager: true });
		//     combinedRules = loadRules<Config>(ruleModulesV2);
		// }
		// Alternatively, load all rules together (matching the code example in "Design Philosophy" above)
		// const allRuleModules = import.meta.glob('@/assets/js/lib/user/MigrationManager/rules/**/*.rule.ts', { eager: true });
		// combinedRules = loadRules<Config>(allRuleModules);

	} catch (e) {
		console.error("Failed to load rule files:", e);
		// Perform appropriate error handling
		return data; // Abort migration and return the original data
	}
	// -----------------------------

	const manager = new MigrationManager<Config>(combinedRules);
	const result = await manager.migrate(data, defaultValues);

	// Log the execution results
	if (result.isExecuted) {
		if (result.hasError) {
			console.error("An error occurred during settings migration.", result.errorReports);
		} else {
			console.log("Settings were migrated. Applied rules:", result.appliedRules);
			// If migration was successful, call the process to persist the migrated settings here
			// Example: saveConfig(result.data);
		}
	} else {
		console.log("Settings migration was not necessary."); // Actually handled by the `if (dataVersion >= LATEST_VERSION)` above
	}

	return result.data;
}

/**
 * A hypothetical function to determine the version from data
 * (Implementation needs to match the actual data structure)
 * @param data - The configuration data.
 * @returns The data version (number).
 */
function detectDataVersion(data: Config): number {
	// Example: returns data.version if it exists, otherwise assumes it's old data and returns 1.
	return data && typeof data.version === 'number' ? data.version : 1;
}
```

## Notes on Execution Environment (Especially Service Worker)

> [!WARNING]
> **Rule modules must be loaded synchronously**
>
> In the Service Worker environment of a Chrome extension, you **cannot use dynamic imports (`import()` or the `{ eager: false }` option of `import.meta.glob`)** provided by Vite/wxt. These refer to the `window` object and will cause a runtime error.
>
> Therefore, when loading rules, you must always specify the `{ eager: true }` option for `import.meta.glob` to process them synchronously. This also makes the `loadRules` utility a **synchronous function** that does not return a `Promise`.
>
> For more details, refer to the [`loadRules.md`](./loadRules.md) document.
