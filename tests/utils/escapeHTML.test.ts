/**
 * Tests for escapeHTML utility
 *
 * Verifies the HTML special character escaping functionality provided by `escapeHTML.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { escapeHTML } from "@/assets/js/utils/escapeHTML";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should return the same string if it contains no special characters", input: "test string", expected: "test string" },
		{ name: "should convert '<' to '&lt;'", input: "<", expected: "&lt;" },
		{ name: "should convert '>' to '&gt;'", input: ">", expected: "&gt;" },
		{ name: "should convert '&' to '&amp;'", input: "&", expected: "&amp;" },
		{ name: "should convert '\"' to '&quot;'", input: "\"", expected: "&quot;" },
		{ name: "should convert \"'\" to '&#x27;'", input: "'", expected: "&#x27;" },
		{ name: "should convert '`' to '&#x60;'", input: "`", expected: "&#x60;" },
		{
			name: "should correctly convert all special characters in a mixed string",
			input: "<script>alert('XSS & \"test\"');</script>",
			expected: "&lt;script&gt;alert(&#x27;XSS &amp; &quot;test&quot;&#x27;);&lt;/script&gt;"
		}
	],
	error: [
		{ name: "should throw TypeError for non-string input (number)", input: [ 123 ], expected: TypeError },
		{ name: "should throw TypeError for non-string input (null)", input: [ null ], expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("escapeHTML Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			return escapeHTML(input);
		});
	});

	describe("Error handling", () => {
		TestRunner.error(testData.error, null, (input) => {
			vi.spyOn(console, "debug").mockImplementation(() => {});
			return escapeHTML(input[0]);
		});
	});
});