/**
 * Tests for parseObjectToValue utility
 *
 * Verifies the simple deep copy functionality using JSON serialization/deserialization,
 * provided by `parseObjectToValue.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { parseObjectToValue } from "@/assets/js/utils/parseObjectToValue";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{
			name: "should copy a simple object",
			input: { a: 1, b: "test" },
			expected: { a: 1, b: "test" }
		},
		{
			name: "should copy nested structures",
			input: { a: { b: 1 }, c: [ 2, 3 ] },
			expected: { a: { b: 1 }, c: [ 2, 3 ] }
		},
		{
			name: "should remove undefined and Function during serialization",
			input: { a: 1, b: undefined, c: () => {} },
			expected: { a: 1 }
		},
		{
			name: "should convert Date objects to ISO strings",
			input: { date: new Date("2026-04-11T00:00:00Z") },
			expected: { date: "2026-04-11T00:00:00.000Z" }
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("parseObjectToValue Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {

		it("return value should be a different reference from the original object (deep copy)", () => {
			// Arrange
			const obj = { a: { b: 1 } };

			// Act
			const result = parseObjectToValue(obj);

			// Assert
			expect(result).toEqual(obj);
			expect(result).not.toBe(obj);
			expect(result.a).not.toBe(obj.a);
		});
	});

	describe("Error cases", () => {
		it("should throw TypeError when invalid data (null) is passed", () => {
			expect(() => parseObjectToValue(null as IntentionalAnyForValidation)).toThrow(TypeError);
		});

		it("should throw TypeError when invalid data (number) is passed", () => {
			expect(() => parseObjectToValue(123 as IntentionalAnyForValidation)).toThrow(TypeError);
		});

		it("should throw a TypeError for objects with circular references", () => {
			// Arrange
			const obj: any = { a: 1 };
			obj.self = obj;

			// Act & Assert
			expect(() => parseObjectToValue(obj)).toThrow(TypeError);
		});
	});
});