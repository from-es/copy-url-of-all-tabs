/**
 * Tests for getWidthOfStringLength utility
 *
 * Verifies the display width calculation functionality (half-width 1, full-width 2)
 * provided by `getWidthOfStringLength.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, afterEach, vi } from "vitest";
import { getWidthOfStringLength } from "@/assets/js/utils/getWidthOfStringLength";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should return 0 for an empty string", input: "", expected: 0 },
		{ name: "should count half-width alphanumeric characters (abc123) as 1 per character", input: "abc123", expected: 6 },
		{ name: "should count full-width characters (あいう) as 2 per character", input: "あいう", expected: 6 },
		{ name: "should correctly sum mixed half-width and full-width characters (aあbい)", input: "aあbい", expected: 6 },
		{ name: "should exclude newline characters (\\n) from the count", input: "a\nb", expected: 2 },
		{ name: "should also exclude Windows-style newlines (\\r\\n) from the count", input: "a\r\nb", expected: 2 },
		{ name: "should count half-width symbols (!@#) as 1 per character", input: "!@#", expected: 3 },
		{ name: "should count full-width symbols (★) as 2 per character", input: "★", expected: 2 },
		{ name: "should count emojis (😀) as 2 (treated as full-width)", input: "😀", expected: 2 },
		{ name: "should count complex emojis (👨‍👩‍👧‍👦) as the sum of full-width components", input: "👨‍👩‍👧‍👦", expected: 14 }
	],
	error: [
		{ name: "should throw TypeError when non-string is passed", input: [ 123 ] as IntentionalAnyForValidation, expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("getWidthOfStringLength Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			return getWidthOfStringLength(input);
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			return getWidthOfStringLength(input[0]);
		});
	});
});