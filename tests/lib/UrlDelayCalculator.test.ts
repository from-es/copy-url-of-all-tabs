/**
 * UrlDelayCalculator Tests
 *
 * Verifies that delays for each URL (individual and cumulative) are calculated accurately
 * based on the URL list, default delay, and custom rules.
 *
 * This file uses a manual `it` block for side-effect verification (console.warn)
 * because the standard `TestRunner.success` pattern focuses on return value equality,
 * whereas this specific case requires asserting that a warning was logged.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { UrlDelayCalculator, type UrlDelayRule } from "@/assets/js/lib/UrlDelayCalculator";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{
			name: "should apply default delay when no rules exist",
			input: { urls: [ "http://test.com" ], defaultDelay: 100, customRules: [], applyFrom: 1 },
			expected: [ { url: "http://test.com", delay: { individual: 0, cumulative: 0 } } ]
		},
		{
			name: "should correctly apply when matchType is prefix (default)",
			input: {
				urls: [ "http://example.com/a" ],
				defaultDelay: 100,
				applyFrom: 1,
				customRules: [ { pattern: "http://example.com", delay: 200, matchType: "prefix" } ]
			},
			expected: [ { url: "http://example.com/a", delay: { individual: 200, cumulative: 200 } } ]
		},
		{
			name: "should behave like prefix when no matchType is specified",
			input: {
				urls: [ "http://example.com/a" ],
				defaultDelay: 100,
				applyFrom: 1,
				customRules: [ { pattern: "http://example.com", delay: 200 } ]
			},
			expected: [ { url: "http://example.com/a", delay: { individual: 200, cumulative: 200 } } ]
		},
		{
			name: "should return an empty array for an empty URL list",
			input: { urls: [], defaultDelay: 100, customRules: [], applyFrom: 1 },
			expected: []
		},
		{
			name: "should apply default delay for match counts earlier than applyFrom",
			input: {
				urls: [ "http://example.com/a", "http://example.com/b" ],
				defaultDelay: 100,
				customRules: [ { pattern: "example.com/b", delay: 500, matchType: "exact" } ],
				applyFrom: 2
			},
			expected: [
				{ url: "http://example.com/a", delay: { individual: 0, cumulative: 0 } },
				{ url: "http://example.com/b", delay: { individual: 100, cumulative: 100 } }
			]
		}
	],
	error: [
		{
			name: "should throw TypeError when invalid urls (null) is passed",
			input: { urls: null as IntentionalAnyForValidation, defaultDelay: 100 },
			expected: TypeError
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("UrlDelayCalculator", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			return UrlDelayCalculator.calculate(
				input.urls,
				input.defaultDelay,
				input.customRules as IntentionalAnyForValidation,
				input.applyFrom
			);
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			UrlDelayCalculator.calculate(
				input.urls,
				input.defaultDelay
			);
		});
	});

	describe("Side-effect and edge cases", () => {
		it("should output a warning and not match if the pattern is an empty string", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const rules = [ { pattern: "", delay: 200 } ];
			const result = UrlDelayCalculator.calculate([ "http://example.com" ], 100, rules as IntentionalAnyForValidation);

			expect(warnSpy).toHaveBeenCalled();
			expect(result[0].delay.individual).toBe(0); // 0 as the first item, not the default delay (100)
		});
	});
});