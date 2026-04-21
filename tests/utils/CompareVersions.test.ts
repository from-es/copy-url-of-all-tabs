/**
 * Tests for compareVersions utility
 *
 * Verifies the semantic versioning comparison functionality
 * provided by `CompareVersions.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { compareVersions } from "@/assets/js/utils/CompareVersions";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		// Basic comparison
		{ name: "should return 0 when versions are equal", input: [ "1.0.0", "1.0.0" ], expected: 0 },
		{ name: "should return -1 when major version is larger", input: [ "2.0.0", "1.9.9" ], expected: -1 },
		{ name: "should return -1 when minor version is larger", input: [ "1.10.0", "1.9.10" ], expected: -1 },
		{ name: "should return -1 when patch version is larger", input: [ "1.0.1", "1.0.0" ], expected: -1 },
		{ name: "should return 1 when major version is smaller", input: [ "1.9.9", "2.0.0" ], expected: 1 },

		// Pre-release
		{ name: "should consider alphabetical order of pre-releases (alpha < beta)", input: [ "1.0.0-alpha", "1.0.0-beta" ], expected: 1 },
		{ name: "should consider numeric fields within pre-releases", input: [ "1.0.0-alpha.1", "1.0.0-alpha.2" ], expected: 1 },
		{ name: "stable version should take precedence over pre-release version", input: [ "1.0.0", "1.0.0-alpha" ], expected: -1 },
		{ name: "numeric identifiers should have lower precedence than string identifiers", input: [ "1.0.0-alpha.1", "1.0.0-alpha.a" ], expected: 1 },
		{ name: "larger number of pre-release fields should have higher precedence", input: [ "1.0.0-alpha.1", "1.0.0-alpha" ], expected: -1 },

		// Metadata
		{ name: "build metadata should be ignored", input: [ "1.0.0+build1", "1.0.0+build2" ], expected: 0 }
	],
	error: [
		// Type errors
		{ name: "should throw error if input1 is null", input: [ null, "1.0.0" ] },
		{ name: "should throw error if input2 is undefined", input: [ "1.0.0", undefined ] },
		{ name: "should throw error if a number is passed", input: [ 123, "1.0.0" ] },

		// Format errors
		{ name: "should throw error for incomplete version strings (missing sections)", input: [ "1.0", "1.0.0" ] },
		{ name: "should throw error for version strings with too many sections", input: [ "1.0.0.0", "1.0.0" ] },
		{ name: "should throw error if pre-release contains invalid characters", input: [ "1.0.0", "1.0.beta" ] },
		{ name: "should throw error if pre-release identifier is empty (dot only)", input: [ "1.0.0", "1.0.0-." ] },

		// Special formats
		{ name: "should throw error for versions with 'v' prefix (v1.0.0)", input: [ "v1.0.0", "1.0.0" ] },
		{ name: "should throw error if leading/trailing spaces are included", input: [ " 1.0.0", "1.0.0" ] },

		// NaN cases (assuming validation is bypassed)
		{ name: "should throw error if section is not a number", input: [ "1.a.0", "1.0.0" ] },

		// Length limit
		{
			name: "should throw error for version strings exceeding 128 characters",
			input: [ "1.0.0-" + "a.".repeat(70), "1.0.0" ],
			expected: "Invalid: one or both of the provided version strings are not valid semantic versions"
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("compareVersions", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases: Comparison of valid versions", () => {
		TestRunner.success(testData.success, null, (input) => {
			return compareVersions(input[0] as any, input[1] as any);
		});
	});

	describe("Error cases: Handling of invalid inputs", () => {
		TestRunner.error(testData.error, null, (input) => {
			// Arrange
			vi.spyOn(console, "error").mockImplementation(() => {});

			// Act
			const result = compareVersions(input[0] as any, input[1] as any);

			// Assert
			return result;
		});
	});

	describe("Edge cases", () => {
		it("should process long strings (within limit) quickly without causing potential ReDoS", () => {
			// Arrange
			const potentialReDoS = "1.0.0-" + "a.".repeat(54) + "a"; // 115 chars (<= 128)

			// Act
			const result = compareVersions(potentialReDoS, "1.0.0");

			// Assert
			expect(result).toBe(1);
		});
	});
});