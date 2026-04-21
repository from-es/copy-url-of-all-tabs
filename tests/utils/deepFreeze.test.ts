/**
 * Tests for deepFreeze utility
 *
 * Verifies the recursive object freezing functionality provided by `deepFreeze.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { deepFreeze } from "@/assets/js/utils/deepFreeze";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should freeze a simple object", input: { a: 1, b: "test" }, expected: true },
		{ name: "should recursively freeze nested objects", input: { a: { b: 1 } }, expected: true },
		{ name: "should recursively freeze nested arrays", input: { a: [ 1, 2, { b: 3 } ] }, expected: true }
	],
	error: [
		{ name: "should throw TypeError when null is passed", input: [ null ], expected: TypeError },
		{ name: "should throw TypeError when a primitive (number) is passed", input: [ 123 ], expected: TypeError },
		{ name: "should throw TypeError when a primitive (string) is passed", input: [ "test" ], expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("deepFreeze Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	const checkFrozen = (obj: any): boolean => {
		if (obj === null || typeof obj !== "object") { return true; }
		if (!Object.isFrozen(obj)) { return false; }
		return Object.getOwnPropertyNames(obj).every(prop => checkFrozen(obj[prop]));
	};

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			const frozen = deepFreeze(input);
			return checkFrozen(frozen);
		});

		it("should throw an error (TypeError) when attempting to modify properties of a frozen object", () => {
			// Arrange
			const obj = { a: 1, b: { c: 2 } };
			const frozen = deepFreeze(obj);

			// Act & Assert
			expect(() => {
				(frozen as any).a = 2;
			}).toThrow(TypeError);

			expect(() => {
				(frozen as any).b.c = 3;
			}).toThrow(TypeError);
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			return deepFreeze(input[0]);
		});
	});
});