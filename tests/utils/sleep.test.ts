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

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sleep } from "@/assets/js/utils/sleep";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types/validation";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should be resolved after the specified time has elapsed", input: 1000, expected: true },
		{ name: "should correctly handle zero millisecond wait", input: 0, expected: true },
		{ name: "should handle maximum wait time (2^31-1)", input: 2147483647, expected: true }
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
			return await promise;
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			return sleep(input);
		});

		it("should throw TypeError when an invalid signal is passed", () => {
			// @ts-expect-error - testing invalid input
			expect(() => sleep(100, { signal: "not a signal" })).toThrow(TypeError);
		});
	});

	describe("AbortSignal Support", () => {
		it("should support AbortSignal for immediate abortion", async () => {
			const controller = new AbortController();
			controller.abort();

			const result = await sleep(1000, { signal: controller.signal });
			expect(result).toBe(false);
		});

		it("should support AbortSignal for abortion during sleep", async () => {
			const controller = new AbortController();

			const promise = sleep(5000, { signal: controller.signal });

			// Advance time a bit then abort
			await vi.advanceTimersByTimeAsync(1000);
			controller.abort();

			const result = await promise;
			expect(result).toBe(false);
		});

		it("should correctly clean up and resolve if not aborted", async () => {
			const controller = new AbortController();
			const promise = sleep(1000, { signal: controller.signal });

			vi.runAllTimers();
			const result = await promise;
			expect(result).toBe(true);
		});
	});
});