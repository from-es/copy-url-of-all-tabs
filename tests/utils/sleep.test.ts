/**
 * Tests for sleep utility
 *
 * Verifies the Promise-based delay execution functionality provided by `sleep.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, beforeEach, afterEach, vi } from "vitest";
import { sleep } from "@/assets/js/utils/sleep";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types/validation";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should be resolved after the specified time has elapsed", input: 1000, expected: undefined },
		{ name: "should correctly handle zero millisecond wait", input: 0, expected: undefined },
		{ name: "should handle maximum wait time (2^31-1)", input: 2147483647, expected: undefined }
	],
	error: [
		{ name: "should throw RangeError when a negative value is passed", input: -1, expected: RangeError },
		{ name: "should throw RangeError when a value exceeding the maximum is passed", input: 2147483648, expected: RangeError },
		{ name: "should throw TypeError when a string is passed", input: "100" as IntentionalAnyForValidation, expected: TypeError },
		{ name: "should throw TypeError when NaN is passed", input: NaN, expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("sleep Utility", () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, async (input) => {
			const promise = sleep(input);
			vi.runAllTimers();
			await promise;
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			return sleep(input);
		});
	});
});