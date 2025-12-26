/**
 * @file MigrationManager.test.ts
 * @lastupdate 2025-11-25
 * @description
 * This file tests the `MigrationManager` function and its interactions with `migrationRules` and `cloneObject`.
 *
 * It ensures that the migration process correctly applies rules, handles errors,
 * and does not mutate the original configuration objects.
 *
 * Dependencies:
 * - `MigrationManager`: The function under test, responsible for applying migration rules.
 * - `migrationRules`: A mocked array of rules, controlled per test case.
 * - `cloneObject`: A utility for deep cloning, mocked to ensure consistent behavior.
 *
 * Test Strategy:
 * - Mocks `cloneObject` globally using `vi.mock` and `vi.mocked` for reliable deep cloning.
 * - Mocks `migrationRules` module with a mutable empty array and pushes specific rules in each test.
 * - Uses `beforeEach` to reset mocks and clear `migrationRules` for test isolation.
 * - Test cases cover scenarios such as no rules, single rule, multiple rules, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import cloneDeep from "lodash-es/cloneDeep";
import { type Config, type Define } from "@/assets/js/types";
import { type MigrationRule } from "@/assets/js/lib/user/MigrationManager/types";
import { cloneObject } from "@/assets/js/lib/user/CloneObject";
// Import the function to be tested and the array to be manipulated
import { MigrationManager } from "@/assets/js/lib/user/MigrationManager";
import { migrationRules } from "@/assets/js/lib/user/MigrationManager/rules";

// Mock the modules.
// - cloneObject is mocked to inspect calls.
// - rules.ts is mocked to provide an empty, mutable array that we can control in each test.
vi.mock("@/assets/js/lib/user/CloneObject");
vi.mock("@/assets/js/lib/user/MigrationManager/rules", () => ({
	migrationRules: [] // Export a mutable empty array
}));

describe("MigrationManager", () => {
	let mockConfig: Config;
	let mockDefine: Define;

	beforeEach(() => {
		// Reset mocks and clear the rules array before each test.
		vi.resetAllMocks();
		migrationRules.length = 0; // Clear the array for test isolation

		// Set up the mock implementation for cloneObject to use a robust deep clone.
		vi.mocked(cloneObject).mockImplementation(cloneDeep);

		// Define common test data
		mockConfig = {
			Information: { name: "Old Name", version: "1.0.0", date: { timestamp: 1678886400000, iso8601: "2023-03-15T00:00:00.000Z" } },
			Debug: { logging: false, timestamp: false, timecoordinate: "UTC" },
			OptionsPage: { fontsize: 16 },
			PopupMenu: { fontsize: 16, ClearMessage: { enable: true, timeout: 5 }, OnClickClose: { enable: true, timeout: 5 } },
			Search: { regex: true },
			Filtering: {
				Deduplicate: { Copy: { enable: false }, Paste: { enable: false } },
				Protocol: { Copy: { enable: true }, Paste: { enable: true }, type: { http: true, https: true, file: false, ftp: false, data: false, blob: false, mailto: false, javascript: false, about: false, chrome: false } },
				PatternMatch: { Copy: { enable: false }, Paste: { enable: false }, type: "prefix", pattern: "" }
			},
			Format: { type: "text", template: "", mimetype: "text/plain" },
			Tab: {
				reverse: false, active: false, delay: 250,
				customDelay: { enable: false, list: [] },
				position: "default",
				TaskControl: { taskMode: "unitary", openMode: "append", chunkSize: 5 }
			},
			Badge: { enable: false, theme: { type: "light", color: { text: "#ffffff", background: "#767676" } } }
		};

		mockDefine = {
			Environment: { Browser: {} },
			Information: {
				author: "Test Author", name: "Test Extension", description: "Test Description", version: "1.1.0",
				BrowserExtensionStore: { chrome: { title: "", url: "", publish: 0 }, firefox: { title: "", url: "", publish: 0 } },
				github: { title: "", url: "" }, document: { default: { title: "", url: "" } },
				updatehistory: { title: "", url: "" }, extension: { id: "" }
			},
			Storage: { keyname: "config" },
			Config: mockConfig, // Using mockConfig as the default config for simplicity in tests
			Verification: [],
			Messaging: {},
			Regex: { url: { standard: /a/, RFC3986: /b/ }, UUID: { v4: /d/ }, NeverMatch: /e/ },
			Message: {},
			MimeType: [],
			ChromiumBasedBrowser: [],
			OptionsPageFontSizeValueMin: 8, OptionsPageFontSizeValueMax: 32, OptionsPageFontSizeValueStep: 1,
			PopupMenuFontSizeValueMin: 8, PopupMenuFontSizeValueMax: 32, PopupMenuFontSizeValueStep: 1,
			PopupMenuClearMessageTimeoutValueMin: 0, PopupMenuClearMessageTimeoutValueMax: 60, PopupMenuClearMessageTimeoutValueStep: 1,
			PopupMenuOnClickCloseTimeoutValueMin: 0, PopupMenuOnClickCloseTimeoutValueMax: 60, PopupMenuOnClickCloseTimeoutValueStep: 1,
			TabOpenDelayValueMin: 0, TabOpenDelayValueMax: 10000, TabOpenDelayValueStep: 1, TabOpenCustomDelayValue: 1000,
			TabOpenCustomDelayMatchType: "prefix", TabOpenCustomDelayApplyFrom: 2,
			DisabledTimeoutValue: 1000,
			OptionsPageInputDebounceTime: 500,
			OptionsPageSortListDebounceTime: 500,
			TaskControlChunkSizeValue: 5, TaskControlChunkSizeValueMin: 1, TaskControlChunkSizeValueMax: 16, TaskControlChunkSizeValueStep: 1
		};
	});

	// Test Case 1: No migration needed (empty rules array)
	it("should return the original data if no migration rules are applied", async () => {
		// Arrange
		const manager = new MigrationManager(migrationRules);

		// Act
		const result = await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		expect(result.data).toEqual(mockConfig);
		expect(result.isExecuted).toBe(false);
	});

	// Test Case 2: No migration needed (rules exist but their conditions are false)
	it("should return the original data if rules exist but none apply (condition returns false)", async () => {
		// Arrange
		const rule: MigrationRule<Config> = {
			meta: { author: "", reason: "", target: "", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			condition: vi.fn(() => false),
			execute: vi.fn(({ data }) => data)
		};
		migrationRules.push(rule);
		const manager = new MigrationManager(migrationRules);

		// Act
		const result = await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		expect(result.data).toEqual(mockConfig);
		expect(result.isExecuted).toBe(false);
		expect(rule.condition).toHaveBeenCalledOnce();
		expect(rule.execute).not.toHaveBeenCalled();
	});

	// Test Case 3: Single migration rule applied successfully
	it("should apply a single migration rule successfully", async () => {
		// Arrange
		const expectedName = "New Name";
		const rule: MigrationRule<Config> = {
			meta: { author: "Test", reason: "Change name", target: "Information.name", action: "Update name", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			condition: () => true,
			execute: ({ data }) => {
				data.Information.name = expectedName;
				return data;
			}
		};
		migrationRules.push(rule);
		const manager = new MigrationManager(migrationRules);

		// Act
		const result = await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		expect(result.data.Information.name).toBe(expectedName);
		expect(result.isSucceeded).toBe(true);
		expect(result.appliedRules).toEqual([ rule.meta ]);
	});

	// Test Case 4: Multiple migration rules applied successfully
	it("should apply multiple migration rules successfully", async () => {
		// Arrange
		const expectedName = "New Name 2";
		const expectedLogging = true;
		const rule1: MigrationRule<Config> = {
			meta: { author: "Test1", reason: "Change name", target: "Information.name", action: "Update name", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			condition: () => true,
			execute: ({ data }) => { data.Information.name = expectedName; return data; }
		};
		const rule2: MigrationRule<Config> = {
			meta: { author: "Test2", reason: "Enable logging", target: "Debug.logging", action: "Set logging to true", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			condition: () => true,
			execute: ({ data }) => { data.Debug.logging = expectedLogging; return data; }
		};
		migrationRules.push(rule1, rule2);
		const manager = new MigrationManager(migrationRules);

		// Act
		const result = await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		expect(result.data.Information.name).toBe(expectedName);
		expect(result.data.Debug.logging).toBe(expectedLogging);
		expect(result.isSucceeded).toBe(true);
		expect(result.appliedRules).toEqual([ rule1.meta, rule2.meta ]);
	});

			  // Test Case 5: A rule throws an error
	 it("should roll back changes from the failed rule but continue processing other rules", async () => {
		// Arrange
		const errorMessage = "Migration failed for this rule";
		const initialConfigSnapshot = cloneDeep(mockConfig);
		const failingRule: MigrationRule<Config> = {
			 meta: { author: "Test1", reason: "Fail rule", target: "Info", action: "Cause error", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			 condition: () => true,
			 execute: () => { throw new Error(errorMessage); }
		};
		const succeedingRule: MigrationRule<Config> = {
			 meta: { author: "Test2", reason: "Succeed rule", target: "Debug.logging", action: "Set logging to true", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			 condition: () => true,
			 execute: ({ data }) => { data.Debug.logging = true; return data; }
		};
		migrationRules.push(failingRule, succeedingRule);
		const manager = new MigrationManager(migrationRules);
		const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Act
		const result = await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		// The final data should not be the mutated data, but the original data because isSucceeded is false
		expect(result.data).toEqual(initialConfigSnapshot); // However, we can check if the successful mutation would have happened by checking the internal state if we could.
		// Since we can't, we check the final output. The succeeding rule was applied, but the overall process failed.
		expect(result.isExecuted).toBe(true);
			 expect(result.hasError).toBe(true);
			 expect(result.isSucceeded).toBe(false);
			 expect(result.appliedRules).toEqual([ succeedingRule.meta ]); // The successful rule's meta is still recorded
			 expect(result.errorReports).toHaveLength(1);
			 expect(result.errorReports[0].rule).toEqual(failingRule.meta);
			 expect(result.errorReports[0].error.message).toBe(errorMessage);
			 expect(result.errorReports[0].data).toEqual(initialConfigSnapshot); // Data before the failing rule
			 expect(consoleErrorSpy).toHaveBeenCalledOnce();
			 consoleErrorSpy.mockRestore();
	});	// Test Case 6: Should not mutate the original config or define objects passed to it
	it("should not mutate the original config or define objects passed to it", async () => {
		// Arrange
		const originalConfigSnapshot = cloneDeep(mockConfig);
		const originalDefineSnapshot = cloneDeep(mockDefine);
		const rule: MigrationRule<Config> = {
			meta: { author: "", reason: "", target: "", action: "", authored: "2025-01-01", version: { introduced: "0.0.0", obsoleted: null } },
			condition: () => true,
			execute: ({ data }) => {
				data.Information.name = "Mutated Name";
				return data;
			}
		};
		migrationRules.push(rule);
		const manager = new MigrationManager(migrationRules);

		// Act
		await manager.migrate(mockConfig, mockDefine.Config);

		// Assert
		expect(mockConfig).toEqual(originalConfigSnapshot);
		expect(mockDefine).toEqual(originalDefineSnapshot);
	});
});