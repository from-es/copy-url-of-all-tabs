/**
 * Module for dynamic aggregation of sequence rules.
 *
 * @file
 * @lastModified 2026-06-20
 */

// Import Module
import { loadRules } from "@/assets/js/lib/SequenceProcessor/loadRules";

// Import Types
import type { Config } from "@/assets/js/types";

/**
 * Dynamically imports migration rules and aggregates them into a single array.
 */
const migrateModules = import.meta.glob("./migrate/*.rules.ts", { eager: true });

/**
 * Dynamically imports patch rules and aggregates them into a single array.
 */
const patchModules = import.meta.glob("./patch/*.rules.ts", { eager: true });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrationRules = loadRules<Config, Partial<Config>>(migrateModules as any);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const patchRules = loadRules<Config, Partial<Config>>(patchModules as any);

export {
	migrationRules,
	patchRules
};