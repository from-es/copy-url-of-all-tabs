/**
 * Tests for MigrationManager
 *
 * Verifies the configuration data migration process (applying rules, error handling,
 * object deep copying, etc.) via `MigrationManager`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import cloneDeep from "lodash-es/cloneDeep";
import { type Config } from "@/assets/js/types";
import { type MigrationRule } from "@/assets/js/lib/MigrationManager/types";
import { cloneObject } from "@/assets/js/lib/CloneObject";
import { MigrationManager } from "@/assets/js/lib/MigrationManager";
import { migrationRules } from "@/assets/js/lib/MigrationManager/rules";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Mocks and Fixtures
// =============================================================================

vi.mock("@/assets/js/lib/CloneObject");
vi.mock("@/assets/js/define", () => ({
	define: {
		Config: {},
		Information: { version: "1.1.0" },
		Regex: { url: { standard: /a/, RFC3986: /b/ } }
	}
}));
vi.mock("@/assets/js/lib/MigrationManager/rules", () => ({
	migrationRules: [] // Export an empty, controllable array
}));

import { define } from "@/assets/js/define";
import { createMockConfig } from "../shared/fixtures/config";
import { createMockDefine } from "../shared/fixtures/define";

// =============================================================================
// 2. Definition of test data
// =============================================================================

const testData = {
	migrate: {
		success: [
			{
				name: "should return the original data as is if no migration rules exist",
				input: { rules: [] },
				expected: { isExecuted: false, isSucceeded: false, name: "Old Name" }
			},
			{
				name: "should return the original data as is if no rules match the conditions",
				input: {
					rules: [
						{
							meta: { author: "", reason: "", target: "", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
							condition: () => false,
							execute: ({ data }) => data
						} as MigrationRule<Config>
					]
				},
				expected: { isExecuted: false, isSucceeded: false, name: "Old Name" }
			},
			{
				name: "should correctly apply a single migration rule",
				input: {
					rules: [
						{
							meta: { author: "Test", reason: "Change name", target: "Information.name", action: "Update", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
							condition: () => true,
							execute: ({ data }) => { data.Information.name = "New Name"; return data; }
						} as MigrationRule<Config>
					]
				},
				expected: { isExecuted: true, isSucceeded: true, name: "New Name" }
			}
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 3. Orchestration
// =============================================================================

describe("MigrationManager", () => {
	let mockConfig: Config;

	beforeEach(() => {
		mockConfig = createMockConfig({
			Information: { name: "Old Name", version: "1.0.0", date: { timestamp: 1678886400000, iso8601: "2023-03-15T00:00:00.000Z" } }
		});
		// Since define is a mock object, we overwrite Config to use it as the base for the test.
		Object.assign(define, createMockDefine(mockConfig));
		vi.mocked(cloneObject).mockImplementation(cloneDeep);
	});

	afterEach(() => {
		// Cleanup
		vi.clearAllMocks();
		migrationRules.length = 0; // Reset rules
	});

	describe("migrate", () => {
		it("should not destructively modify the original configuration data during execution", async () => {
			// Arrange
			const originalConfig = cloneDeep(mockConfig);
			migrationRules.push({
				meta: { author: "", reason: "", target: "", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
				condition: () => true,
				execute: ({ data }) => { data.Information.name = "Mutated"; return data; }
			} as MigrationRule<Config>);
			const manager = new MigrationManager(migrationRules);

			// Act
			await manager.migrate(mockConfig, define.Config);

			// Assert
			expect(mockConfig).toEqual(originalConfig);
		});

		it("should rollback the failing rule but retain other successful rules if an error occurs during execution", async () => {
			// Arrange
			const failingRule: MigrationRule<Config> = {
				meta: { author: "Bad", reason: "Fail", target: "", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
				condition: () => true,
				execute: () => { throw new Error("Migration failed"); }
			};
			const succeedingRule: MigrationRule<Config> = {
				meta: { author: "Good", reason: "Succeed", target: "Debug.logging", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
				condition: () => true,
				execute: ({ data }) => { data.Debug.logging = true; return data; }
			};
			migrationRules.push(failingRule, succeedingRule);
			const manager = new MigrationManager(migrationRules);
			const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => { });

			// Act
			const result = await manager.migrate(mockConfig, define.Config);

			// Assert
			expect(result.isSucceeded).toBe(false);
			expect(result.hasError).toBe(true);
			expect(result.appliedRules).toContainEqual(succeedingRule.meta);
			expect(result.errorReports[0].rule).toEqual(failingRule.meta);
			consoleSpy.mockRestore();
		});

		// Data-driven tests
		TestRunner.success(testData.migrate.success, null, async (input) => {
			// Arrange
			migrationRules.push(...input.rules);
			const manager = new MigrationManager(migrationRules);

			// Act
			const result = await manager.migrate(mockConfig, define.Config);

			// Assert
			return {
				isExecuted: result.isExecuted,
				isSucceeded: result.isSucceeded,
				name: result.data.Information.name
			};
		});
	});
});