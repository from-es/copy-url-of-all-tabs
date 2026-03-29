/**
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
 *
 * @file
 * @lastModified 2026-03-29
 */

import { describe, it, expect, vi } from "vitest";
import { UrlDelayCalculator, type UrlDelayRule, type UrlDelayCalculationResult } from "@/assets/js/lib/user/UrlDelayCalculator";

interface TestCase {
	name           : string;
	urls           : string[];
	defaultDelay   : number;
	customRules    : UrlDelayRule[];
	applyFrom      : number;
	expectedResults: UrlDelayCalculationResult[];
}

// Mock WXT's browser API module before importing modules that depend on it
vi.mock("wxt/browser", () => ({
	browser: {
		runtime: {
			getManifest: vi.fn(() => ({
				author     : "From E",
				name       : "Copy URL of All Tabs",
				description: "A browser extension for copying all tab URLs.",
				version    : "1.0.0"
			})),
			id: "dummy-extension-id"
		}
	}
}));

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
		{
			name        : "should correctly escape and match regex meta-characters in pattern",
			urls        : [
				"http://example.com/page[1]",
				"http://example.com/page[1]",
				"http://example.com/path\\to\\file",
				"http://example.com/path\\to\\file",
				"http://example.com/group(A)|B",
				"http://example.com/group(A)|B",
				"http://example.com/1+1=2?",
				"http://example.com/1+1=2?"
			],
			defaultDelay: 100,
			applyFrom   : 2,
			customRules : [
				{ pattern: "page[1]",        delay: 500, matchType: "substring" },
				{ pattern: "path\\to\\file", delay: 800, matchType: "substring" },
				{ pattern: "group(A)|B",     delay: 999, matchType: "substring" },
				{ pattern: "1+1=2?",         delay: 777, matchType: "substring" }
			],
			expectedResults: [
				{ url: "http://example.com/page[1]",        delay: { individual:   0, cumulative:    0 } },
				{ url: "http://example.com/page[1]",        delay: { individual: 500, cumulative:  500 } },
				{ url: "http://example.com/path\\to\\file", delay: { individual: 100, cumulative:  600 } },
				{ url: "http://example.com/path\\to\\file", delay: { individual: 800, cumulative: 1400 } },
				{ url: "http://example.com/group(A)|B",     delay: { individual: 100, cumulative: 1500 } },
				{ url: "http://example.com/group(A)|B",     delay: { individual: 999, cumulative: 2499 } },
				{ url: "http://example.com/1+1=2?",         delay: { individual: 100, cumulative: 2599 } },
				{ url: "http://example.com/1+1=2?",         delay: { individual: 777, cumulative: 3376 } }
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