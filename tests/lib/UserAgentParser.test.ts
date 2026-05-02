/**
 * Tests for UserAgentParser
 *
 * Verifies the DI behavior concerning the parsing of UserAgentParser as well as
 * the default behavior when navigator information is missing.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, beforeEach, afterEach, expect, vi } from "vitest";
import { UserAgentParser } from "@/assets/js/lib/BrowserEnvironment/UserAgentParser";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data (separation of verification data and logic)
// =============================================================================

const failedResultTemplate = {
	browser: { name: undefined, version: undefined },
	engine : { name: undefined, version: undefined },
	os     : { name: undefined, version: undefined, versionName: undefined }
};

const pluginMockData = {
	browser: { name: "Chrome", version: "114" },
	engine : { name: "Blink", version: "114" },
	os     : { name: "Windows", version: "10", versionName: "10" }
};

const testData = {
	successCases: [
		{
			name: "should return data when navigator.userAgent exists and the plugin returns valid data",
			input: {
				userAgent: "Mozilla/5.0...",
				pluginReturn: pluginMockData
			},
			expected: pluginMockData
		},
		{
			name: "should return fallback (failure result) if navigator.userAgent does not exist",
			input: {
				userAgent: undefined, // Simulate environment where userAgent is missing
				pluginReturn: pluginMockData
			},
			expected: failedResultTemplate
		},
		{
			name: "should return fallback result if the plugin execution result is null (parsing failure)",
			input: {
				userAgent: "Mozilla/5.0...",
				pluginReturn: null
			},
			expected: failedResultTemplate
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. オーケストレーション (Structure)
// =============================================================================

describe("UserAgentParser", () => {
	let originalNavigator: any;

	beforeEach(() => {
		// Arrange: Backup and mock navigator
		originalNavigator = globalThis.navigator;
	});

	afterEach(() => {
		// Cleanup
		Object.defineProperty(globalThis, "navigator", {
			value: originalNavigator,
			configurable: true
		});
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.successCases, null, (input) => {
			// Arrange
			if (input.userAgent === undefined) {
				// Mock the entire navigator to hide userAgent
				Object.defineProperty(globalThis, "navigator", {
					value: {},
					configurable: true
				});
			} else {
				Object.defineProperty(globalThis, "navigator", {
					value: { userAgent: input.userAgent },
					configurable: true
				});
			}

			const mockPluginFn = vi.fn().mockReturnValue(input.pluginReturn);
			const parser = new UserAgentParser(mockPluginFn, "mockLibrary");

			// Act
			const result = parser.parse();

			// Assert property directly
			expect(parser.useLibrary).toBe("mockLibrary");

			return result;
		});
	});
});