/**
 * Tests for isEqual utility
 *
 * Verifies the deep equality comparison functionality for objects and arrays
 * provided by `isEqual.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { isEqual } from "@/assets/js/utils/isEqual";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		// Primitives
		{ name: "should return true for identical strings", input: [ "a", "a" ], expected: true },
		{ name: "should return false for different strings", input: [ "a", "b" ], expected: false },
		{ name: "should return true for identical numbers", input: [ 1, 1 ], expected: true },
		{ name: "should return true for NaN compared with NaN", input: [ NaN, NaN ], expected: true },
		{ name: "should return true for null compared with null", input: [ null, null ], expected: true },
		{ name: "should return true for undefined compared with undefined", input: [ undefined, undefined ], expected: true },

		// Type mismatch
		{ name: "should return false for number 1 and string '1'", input: [ 1, "1" ], expected: false },
		{ name: "should return false for null and undefined", input: [ null, undefined ], expected: false },

		// Objects
		{ name: "should return true for two empty objects", input: [ {}, {} ], expected: true },
		{ name: "should return true for objects with the same properties", input: [ { a: 1, b: 2 }, { a: 1, b: 2 } ], expected: true },
		{ name: "should return true for objects with the same content but different property order", input: [ { a: 1, b: 2 }, { b: 2, a: 1 } ], expected: true },
		{ name: "should return false for objects with different property values", input: [ { a: 1 }, { a: 2 } ], expected: false },
		{ name: "should return false for objects with different number of properties", input: [ { a: 1 }, { a: 1, b: 2 } ], expected: false },

		// Arrays
		{ name: "should return true for two empty arrays", input: [ [], [] ], expected: true },
		{ name: "should return true for arrays with the same elements", input: [ [ 1, 2, 3 ], [ 1, 2, 3 ] ], expected: true },
		{ name: "should return false for arrays with elements in different order", input: [ [ 1, 2, 3 ], [ 1, 3, 2 ] ], expected: false },
		{ name: "should return false for arrays with different number of elements", input: [ [ 1, 2 ], [ 1, 2, 3 ] ], expected: false },

		// Nested structures
		{
			name: "should return true if nested objects are equal",
			input: [
				{ a: { b: 1, c: [ 1, 2 ] } },
				{ a: { b: 1, c: [ 1, 2 ] } }
			],
			expected: true
		},
		{
			name: "should return false if objects within nested arrays are different",
			input: [
				[ { id: 1 }, { id: 2 } ],
				[ { id: 1 }, { id: 3 } ]
			],
			expected: false
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("isEqual Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Deep Equality Check", () => {
		TestRunner.success(testData.success, null, (input) => {
			return isEqual(input[0], input[1]);
		});
	});
});