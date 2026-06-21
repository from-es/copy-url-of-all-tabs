// Import Types
import type { Config } from "@/assets/js/types";

/**
 * Context structure used for rule filtering in the migration/patch process.
 */
export type MigrationContext = Partial<Config> & {
	version : string;
	platform: string;
};