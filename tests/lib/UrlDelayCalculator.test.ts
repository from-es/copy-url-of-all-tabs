/**
 * Tests for UrlDelayCalculator
 *
 * Verifies that delays for each URL (individual and cumulative) are calculated accurately
 * based on the URL list, default delay, and custom rules.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { UrlDelayCalculator, type UrlDelayRule } from "@/assets/js/lib/user/UrlDelayCalculator";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const urlList = [ "http://example.com/a", "http://example.com/b" ];

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
				input.customRules as any,
				input.applyFrom
			);
		});
	});

	describe("Error cases and edge cases", () => {
		it("should return an empty array for an empty URL list", () => {
			const result = UrlDelayCalculator.calculate([], 100);
			expect(result).toEqual([]);
		});

		it("should output a warning and not match if the pattern is an empty string", () => {
			const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
			const rules = [ { pattern: "", delay: 200 } ];
			const result = UrlDelayCalculator.calculate([ "http://example.com" ], 100, rules as any);

			expect(warnSpy).toHaveBeenCalled();
			expect(result[0].delay.individual).toBe(0); // 0 as the first item, not the default delay (100)
		});

		it("should apply default delay for match counts earlier than applyFrom", () => {
			// Arrange
			const rules = [ { pattern: "example.com/b", delay: 500, matchType: "exact" } ];

			// Act
			const result = UrlDelayCalculator.calculate(
				[ "http://example.com/a", "http://example.com/b" ],
				100,
				rules as any,
				2
			);

			// Assert
			expect(result[0].delay.individual).toBe(0);   // First
			expect(result[1].delay.individual).toBe(100); // Default delay applied as it's the first match on the second URL
		});
	});
});