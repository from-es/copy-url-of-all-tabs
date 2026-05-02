/**
 * Module for dynamic aggregation of migration rules.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import Module
import { loadRules, type RuleModule } from "../loadRules";

// Import Types
import type { Config } from "@/assets/js/types";



/**
 * Dynamically imports migration rules for the v1 series and aggregates them into a single array.
 *
 * Uses `import.meta.glob` to search for all `.rules.ts` files under the `./migrate/`
 * directory and processes them through the `loadRules` utility.
 *
 * @remarks Due to Vite constraints, the argument to `import.meta.glob` must be a string literal.
 *
 * @returns {MigrationRule<Config>[]} An array of sorted and validated migration rules.
 *
 * @see {@link ../loadRules.ts}
 */
const modules = import.meta.glob<RuleModule<Config>>("./migrate/*.rules.ts", { eager: true });

const migrationRules = loadRules<Config>(modules);



export { migrationRules };