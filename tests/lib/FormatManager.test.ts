/**
 * Tests for FormatManager
 *
 * Verifies the string formatting process via `FormatManager.format`,
 * as well as variable substitution logic ($title, $url) and escaping functionality.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import type { Browser } from "wxt/browser";
import { describe, afterEach, vi } from "vitest";
import { FormatManager } from "@/entrypoints/popup/lib/FormatManager";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

/** Standard mock tabs for general tests. */
const mockTabs = [
	{ title: "Example Page", url: "http://example.com" } as Browser.tabs.Tab,
	{ title: "Another Page", url: "http://another.com" } as Browser.tabs.Tab
];

const testData = {
	success: [
		{
			name: "format: text - should return a newline-separated list of URLs",
			input: { tabs: mockTabs, format: "text", template: null, sanitize: false },
			expected: "http://example.com\nhttp://another.com"
		},
		{
			name: "format: json - should return a formatted JSON string",
			input: { tabs: mockTabs, format: "json", template: null, sanitize: false },
			expected: JSON.stringify(mockTabs.map(t => ({ title: t.title, url: t.url })), null, "\t")
		},
		{
			name: "format: custom - should correctly substitute $title and $url",
			input: { tabs: mockTabs, format: "custom", template: "[$title]($url)", sanitize: false },
			expected: "[Example Page](http://example.com)\n[Another Page](http://another.com)"
		},
		{
			name: "format: custom - placeholders should be case-insensitive",
			input: { tabs: mockTabs, format: "custom", template: "$TITLE: $URL", sanitize: false },
			expected: "Example Page: http://example.com\nAnother Page: http://another.com"
		},
		{
			name: "format: custom - should handle regex special characters in replacement values as is",
			input: {
				tabs: [ { title: "Price: $100", url: "http://shop.com/search?q=$&" } as Browser.tabs.Tab ],
				format: "custom", template: "$title - $url", sanitize: false
			},
			expected: "Price: $100 - http://shop.com/search?q=$&"
		},
		{
			name: "format: custom - should avoid recursive replacement and replace only once",
			input: {
				tabs: [ { title: "Contains $url", url: "http://realworld.com" } as Browser.tabs.Tab ],
				format: "custom", template: "Title: $title, URL: $url", sanitize: false
			},
			expected: "Title: Contains $url, URL: http://realworld.com"
		},
		{
			name: "format: custom - should perform HTML escaping when sanitize is true",
			input: {
				tabs: [ { title: "Title <with> tags & symbols", url: "http://example.com?q=a&b=c" } as Browser.tabs.Tab ],
				format: "custom", template: "<li>$title</li>", sanitize: true
			},
			expected: "<li>Title &lt;with&gt; tags &amp; symbols</li>"
		},
		{
			name: "format: custom - should correctly process multi-line templates",
			input: {
				tabs: [ mockTabs[0] ],
				format: "custom", template: "Template Start\nTitle: $title\nURL: $url\nTemplate End", sanitize: false
			},
			expected: "Template Start\nTitle: Example Page\nURL: http://example.com\nTemplate End"
		},
		{
			name: "format: custom - should return an error message if the template is null",
			input: { tabs: mockTabs, format: "custom", template: null, sanitize: false },
			expected: "Error, Row template is empty! (see options page)"
		},
		{
			name: "format: custom - should return an error message if the template is an empty string",
			input: { tabs: mockTabs, format: "custom", template: "", sanitize: false },
			expected: "Error, Row template is empty! (see options page)"
		},
		{
			name: "format: custom - should treat missing titles or URLs as empty strings",
			input: {
				tabs: [ { title: undefined, url: undefined } as IntentionalAnyForValidation ],
				format: "custom", template: "$title|$url", sanitize: false
			},
			expected: "|"
		}
	],
	error: [
		{
			name: "should throw an error if an invalid format is specified",
			input: { tabs: mockTabs, format: "invalid", template: null, sanitize: false },
			expected: "Error: no match switch case in FormatManager.format"
		}
	]
} as const satisfies Record<string, Record<string, readonly TestCase[]> | readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("FormatManager", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			// Arrange & Act
			return FormatManager.format(
				input.tabs as IntentionalAnyForValidation,
				input.format as IntentionalAnyForValidation,
				input.template,
				input.sanitize
			);
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			// Arrange
			vi.spyOn(console, "error").mockImplementation(() => {});
			// Act & Assert
			return FormatManager.format(
				input.tabs as IntentionalAnyForValidation,
				input.format as IntentionalAnyForValidation,
				input.template,
				input.sanitize
			);
		});
	});
});