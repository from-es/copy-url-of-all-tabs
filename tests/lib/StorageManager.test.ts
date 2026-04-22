/**
 * Tests for StorageManager
 *
 * Verifies data management functionality via browser.storage.local provided by `StorageManager.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { browser } from "wxt/browser";
import { describe, it, beforeEach, expect, vi } from "vitest";
import { StorageManager } from "@/assets/js/lib/user/StorageManager";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// Mock settings for browser.storage.local
vi.mock("wxt/browser", () => ({
	browser: {
		storage: {
			local: {
				get: vi.fn(),
				set: vi.fn(),
				remove: vi.fn(),
				clear: vi.fn()
			}
		}
	}
}));

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	save: {
		success: [
			{ name: "should save a valid object and return true", input: { key1: "value1" }, expected: true }
		],
		error: [
			{ name: "should return false and not save if an empty key is included", input: { "": "value" }, expected: false },
			{ name: "should return false if the API throws an error", input: { key1: "value1" }, expected: false }
		]
	},
	load: {
		success: [
			{ name: "should be able to load data for specified keys", input: [ "key1" ], expected: { key1: "value1" } },
			{ name: "should be able to load all data when null is passed", input: null, expected: { key1: "v1", key2: "v2" } }
		],
		error: [
			{ name: "should return null when an invalid key format (number) is passed", input: 123 as any, expected: null },
			{ name: "should return null when an invalid key format (boolean) is passed", input: true as any, expected: null }
		]
	},
	removeAll: {
		success: [
			{ name: "should remove all data and return true", input: null, expected: true }
		],
		error: [
			{ name: "should return false if the API throws an error", input: null, expected: false }
		]
	},
	remove: {
		success: [
			{ name: "should remove a single key and return true", input: "key1", expected: true }
		],
		error: [
			{ name: "should return false if the API throws an error", input: "key1", expected: false },
			{ name: "should return false for an invalid key (empty string)", input: "", expected: false }
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("StorageManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("save", () => {
		TestRunner.success(testData.save.success, null, async (input) => {
			(browser.storage.local.set as any).mockResolvedValue(undefined);
			return await StorageManager.save(input);
		});

		TestRunner.success(testData.save.error, null, async (input, _ctx, caseData) => {
			if (caseData.name.includes("API throws an error")) {
				(browser.storage.local.set as any).mockRejectedValue(new Error("API Error"));
				vi.spyOn(console, "error").mockImplementation(() => {});
			}
			return await StorageManager.save(input);
		});
	});

	describe("load", () => {
		TestRunner.success(testData.load.success, null, async (input) => {
			(browser.storage.local.get as any).mockResolvedValue(input === null ? { key1: "v1", key2: "v2" } : { key1: "value1" });
			return await StorageManager.load(input);
		});

		TestRunner.success(testData.load.error, null, async (input) => {
			return await StorageManager.load(input);
		});
	});

	describe("removeAll", () => {
		TestRunner.success(testData.removeAll.success, null, async () => {
			(browser.storage.local.clear as any).mockResolvedValue(undefined);
			return await StorageManager.removeAll();
		});

		TestRunner.success(testData.removeAll.error, null, async () => {
			(browser.storage.local.clear as any).mockRejectedValue(new Error("API Error"));
			vi.spyOn(console, "error").mockImplementation(() => {});
			return await StorageManager.removeAll();
		});
	});

	describe("remove", () => {
		TestRunner.success(testData.remove.success, null, async (input) => {
			(browser.storage.local.remove as any).mockResolvedValue(undefined);
			return await StorageManager.remove(input);
		});

		TestRunner.success(testData.remove.error, null, async (input, _ctx, caseData) => {
			if (caseData.name.includes("API throws an error")) {
				(browser.storage.local.remove as any).mockRejectedValue(new Error("API Error"));
				vi.spyOn(console, "error").mockImplementation(() => {});
			}
			return await StorageManager.remove(input);
		});
	});

	describe("view (debug method)", () => {
		it("should display data via console.debug", async () => {
			// Arrange
			const data = { key: "val" };
			(browser.storage.local.get as any).mockResolvedValue(data);
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});

			// Act
			await StorageManager.view("key");

			// Assert
			expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining("view local storage items"), { items: data });
		});

		it("should output an error log when the API throws an error", async () => {
			// Arrange
			(browser.storage.local.get as any).mockRejectedValue(new Error("API Error"));
			const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

			// Act
			await StorageManager.view("key");

			// Assert
			expect(errorSpy).toHaveBeenCalled();
		});
	});

	describe("test (debug method)", () => {
		it("should output console.debug", () => {
			const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
			StorageManager.test();
			expect(debugSpy).toHaveBeenCalled();
		});
	});
});