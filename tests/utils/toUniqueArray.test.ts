/**
 * Tests for toUniqueArray utility
 *
 * Verifies functionalities for removing duplicate elements from an array
 * and validating primitive arrays, provided by `toUniqueArray.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, afterEach, vi } from "vitest";
import { toUniqueArray, validatePrimitiveArray } from "@/assets/js/utils/toUniqueArray";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	toUniqueArray: {
		success: [
			{ name: "should return a numeric array without duplicates as is", input: [ 1, 2, 3 ], expected: [ 1, 2, 3 ] },
			{ name: "should remove duplicates from a numeric array with duplicates", input: [ 1, 2, 2, 3, 1 ], expected: [ 1, 2, 3 ] },
			{ name: "should remove duplicates from a string array with duplicates", input: [ "a", "b", "a", "c" ], expected: [ "a", "b", "c" ] },
			{ name: "should return an empty array for an empty array", input: [], expected: [] },
			{ name: "should remove duplicates of object references", input: (() => {
				const obj = { id: 1 };
				return [ obj, obj, { id: 1 } ];
			})(), expected: [ { id: 1 }, { id: 1 } ] } // Objects with the same reference are removed, while objects with the same content but different references remain.
		],
		error: [
			{ name: "should throw an error if non-array (null) is passed", input: null as IntentionalAnyForValidation, expected: /Invalid: expected an array/ },
			{ name: "should throw an error if non-array (number) is passed", input: 123 as IntentionalAnyForValidation, expected: /Invalid: expected an array/ }
		]
	},
	validatePrimitiveArray: {
		success: [
			{ name: "should consider an empty array as valid", input: [] },
			{ name: "should consider an array of only numbers as valid", input: [ 1, 2, 3 ] },
			{ name: "should consider an array of only strings as valid", input: [ "a", "b", "c" ] },
			{ name: "should consider an array of only BigInts as valid", input: [ BigInt(1), BigInt(2) ] },
			{ name: "should consider an array of only Symbols as valid", input: [ Symbol("a"), Symbol("b") ] }
		],
		error: [
			{ name: "should throw an error if non-array is passed", input: null as IntentionalAnyForValidation, expected: /Invalid: expected an array/ },
			{ name: "should throw an error if an unauthorized type (object) is included", input: [ {} ] as IntentionalAnyForValidation, expected: /Invalid: expected array element type/ },
			{ name: "should throw an error if an unauthorized type (null) is included", input: [ null ] as IntentionalAnyForValidation, expected: /Invalid: expected array element type/ },
			{ name: "should throw an error if mixed types (number and string) are included", input: [ 1, "a" ] as IntentionalAnyForValidation, expected: /Invalid: all elements in array must be of the same type/ }
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("toUniqueArray Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("toUniqueArray", () => {
		describe("Success cases", () => {
			TestRunner.success(testData.toUniqueArray.success, null, (input) => {
				return toUniqueArray(input);
			});
		});

		describe("Error handling", () => {
			TestRunner.error(testData.toUniqueArray.error, null, (input) => {
				return toUniqueArray(input);
			});
		});
	});

	describe("validatePrimitiveArray", () => {
		describe("Success cases", () => {
			TestRunner.success(testData.validatePrimitiveArray.success, null, (input) => {
				validatePrimitiveArray(input);
			});
		});

		describe("Error handling", () => {
			TestRunner.error(testData.validatePrimitiveArray.error, null, (input) => {
				validatePrimitiveArray(input);
			});
		});
	});
});