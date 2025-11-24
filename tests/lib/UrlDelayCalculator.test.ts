/**
 * @file UrlDelayCalculator.test.ts
 * @lastupdate 2025-08-30
 * @description
 * This file was created to verify the functionality of the `UrlDelayCalculator` class,
 * defined in `src/assets/js/lib/user/UrlDelayCalculator/index.ts`, and to ensure that
 * the path alias `@/assets/js/lib/user/UrlDelayCalculator` is correctly resolved by Vitest.
 *
 * Purpose of Inspection:
 * - To confirm that the `UrlDelayCalculator.calculate` method accurately calculates
 *   the delay times for a list of URLs based on default settings and custom rules.
 * - To verify that the path alias configured in `tsconfig.json` functions correctly
 *   within the Vitest environment, allowing for proper module imports.
 *
 * Inspection Method:
 * - The `UrlDelayCalculator.calculate` method is provided with various URL lists,
 *   default delays, and custom rules as input. The results are then compared against
 *   the expected delay calculation outcomes (individual and cumulative delays).
 * - Multiple test cases are executed in a data-driven manner using `it.each` to
 *   enhance test coverage.
 */

import { describe, it, expect } from "vitest";
import { UrlDelayCalculator, type UrlDelayRule, type UrlDelayCalculationResult } from "@/assets/js/lib/user/UrlDelayCalculator";

interface TestCase {
	name           : string;
	urls           : string[];
	defaultDelay   : number;
	customRules    : UrlDelayRule[];
	applyFrom      : number;
	expectedResults: UrlDelayCalculationResult[];
}

const urlList = [
	"http://example.com/a",
	"http://example.com/b",
	"http://example.com/c",
	"http://example.com/d",
	"http://example.com/e",
	"http://example.com/a",
	"http://example.com/b",
	"http://example.com/c",
	"http://example.com/d",
	"http://example.com/e"
];

describe("UrlDelayCalculator", () => {
	const testCases: TestCase[] = [
		{
			name           : "should calculate delays using defaultDelay when applyFrom is 2",
			urls           : urlList,
			defaultDelay   : 100,
			customRules    : [],
			applyFrom      : 2,
			expectedResults: [
				{ url: "http://example.com/a", delay: { individual:   0, cumulative:   0 } }, // First item
				{ url: "http://example.com/b", delay: { individual: 100, cumulative: 100 } },
				{ url: "http://example.com/c", delay: { individual: 100, cumulative: 200 } },
				{ url: "http://example.com/d", delay: { individual: 100, cumulative: 300 } },
				{ url: "http://example.com/e", delay: { individual: 100, cumulative: 400 } },
				{ url: "http://example.com/a", delay: { individual: 100, cumulative: 500 } },
				{ url: "http://example.com/b", delay: { individual: 100, cumulative: 600 } },
				{ url: "http://example.com/c", delay: { individual: 100, cumulative: 700 } },
				{ url: "http://example.com/d", delay: { individual: 100, cumulative: 800 } },
				{ url: "http://example.com/e", delay: { individual: 100, cumulative: 900 } }
			]
		},
		{
			name        : "should apply custom rules correctly with multiple substring rules",
			urls        : urlList,
			defaultDelay: 100,
			applyFrom   : 2,
			customRules : [
				{ pattern: "example.com/c", delay: 250, matchType: "substring" },
				{ pattern: "example.com/e", delay: 500, matchType: "substring" }
			],
			expectedResults: [
				{ url: "http://example.com/a", delay: { individual:   0, cumulative:    0 } }, // First item
				{ url: "http://example.com/b", delay: { individual: 100, cumulative:  100 } },
				{ url: "http://example.com/c", delay: { individual: 100, cumulative:  200 } },
				{ url: "http://example.com/d", delay: { individual: 100, cumulative:  300 } },
				{ url: "http://example.com/e", delay: { individual: 100, cumulative:  400 } },
				{ url: "http://example.com/a", delay: { individual: 100, cumulative:  500 } },
				{ url: "http://example.com/b", delay: { individual: 100, cumulative:  600 } },
				{ url: "http://example.com/c", delay: { individual: 250, cumulative:  850 } }, // Second match for /c rule >> "applyFrom: 2"
				{ url: "http://example.com/d", delay: { individual: 100, cumulative:  950 } },
				{ url: "http://example.com/e", delay: { individual: 500, cumulative: 1450 } }  // Second match for /e rule >> "applyFrom: 2"
			],
		},
		{
			name        : "should handle exact matchType correctly",
			urls        : urlList,
			defaultDelay: 100,
			applyFrom   : 2,
			customRules : [
				{ pattern: "http://example.com/c", delay: 250, matchType: "exact" },
				{ pattern: "http://example.com/e", delay: 999, matchType: "substring" }, // This should not match
			],
			expectedResults: [
				{ url: "http://example.com/a", delay: { individual:   0, cumulative:    0 } }, // First item
				{ url: "http://example.com/b", delay: { individual: 100, cumulative:  100 } },
				{ url: "http://example.com/c", delay: { individual: 100, cumulative:  200 } },
				{ url: "http://example.com/d", delay: { individual: 100, cumulative:  300 } },
				{ url: "http://example.com/e", delay: { individual: 100, cumulative:  400 } },
				{ url: "http://example.com/a", delay: { individual: 100, cumulative:  500 } },
				{ url: "http://example.com/b", delay: { individual: 100, cumulative:  600 } },
				{ url: "http://example.com/c", delay: { individual: 250, cumulative:  850 } }, // Second exact match for /c rule >> "applyFrom: 2"
				{ url: "http://example.com/d", delay: { individual: 100, cumulative:  950 } },
				{ url: "http://example.com/e", delay: { individual: 999, cumulative: 1949 } }  // Second substring match for /e rule >> "applyFrom: 2"
			],
		},
	];

	testCases.forEach(({ name, urls, defaultDelay, customRules, applyFrom, expectedResults }) => {
		it(name, () => {
			const results = UrlDelayCalculator.calculate(urls, defaultDelay, customRules, applyFrom);
			expect(results.length).toBe(expectedResults.length);
			expect(results).toEqual(expectedResults);
		});
	});
});