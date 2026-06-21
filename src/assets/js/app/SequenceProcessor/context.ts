/**
 * Utility for creating a migration context based on browser environment information.
 *
 * @file
 * @lastModified 2026-06-20
 *
 * @dependency BrowserEnvironment
 */

// Import Module
import { BrowserEnvironment } from "@/assets/js/lib/BrowserEnvironment";

// Import Types
import type { Define }           from "@/assets/js/types";
import type { MigrationContext } from "@/assets/js/app/SequenceProcessor/types";



/**
 * Creates a migration context object based on the provided definition and browser environment.
 *
 * @param   {Define}                    define - The configuration definition object.
 * @returns {Promise<MigrationContext>}          The constructed migration context.
 */
export async function createMigrationContext(define: Define): Promise<MigrationContext> {
	const browserEnv = new BrowserEnvironment();
	const env        = await browserEnv.get();

	return {
		...define.Config,
		version : String(define.Information.version),
		platform: env.information.browser.name?.toLowerCase() ?? "other"
	};
}