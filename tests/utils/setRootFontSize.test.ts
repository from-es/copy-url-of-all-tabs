/**
 * setRootFontSize Utility Tests
 *
 * Verifies that the base font size is correctly applied to the document root
 * and body elements using CSS variables and priority overrides.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, beforeEach, afterEach, expect, it, vi } from "vitest";
import { setRootFontSize } from "../../src/assets/js/utils/setRootFontSize";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types/validation";

// =============================================================================
// 1. Test Data (Separation of Data and Logic)
// =============================================================================

interface SuccessInput {
	readonly fontSize: number;
}

interface SuccessExpected {
	readonly rootBaseFontSize: string;
	readonly rootFontSize: string;
	readonly rootFontSizePriority: string;
	readonly bodyFontSize: string;
	readonly bodyFontSizePriority: string;
}

const testData = {
	successCases: [
		{
			name: "should apply font size 16px to root and body",
			input: { fontSize: 16 },
			expected: {
				rootBaseFontSize: "16px",
				rootFontSize: "var(--base-font-size)",
				// NOTE: JSDOM (as of current version) fails to report priority for documentElement.style
				// even if set correctly. In a real browser, this would be "important".
				rootFontSizePriority: "",
				bodyFontSize: "1rem",
				bodyFontSizePriority: "important"
			}
		},
		{
			name: "should apply font size 24px (large value) correctly",
			input: { fontSize: 24 },
			expected: {
				rootBaseFontSize: "24px",
				rootFontSize: "var(--base-font-size)",
				rootFontSizePriority: "",
				bodyFontSize: "1rem",
				bodyFontSizePriority: "important"
			}
		}
	],
	errorCases: [
		{
			name: "should throw TypeError if fontSize is not a number",
			input: "16" as IntentionalAnyForValidation,
			expected: 'Invalid: argument "fontSize" must be an integer, but received string (16)'
		},
		{
			name: "should throw TypeError if fontSize is not an integer",
			input: 16.5 as IntentionalAnyForValidation,
			expected: 'Invalid: argument "fontSize" must be an integer, but received number (16.5)'
		},
		{
			name: "should throw RangeError if fontSize is 0",
			input: 0,
			expected: "Invalid: argument \"fontSize\" out of range (1 ~ MAX_SAFE_INTEGER). Received: 0"
		},
		{
			name: "should throw RangeError if fontSize is negative",
			input: -1,
			expected: "Invalid: argument \"fontSize\" out of range (1 ~ MAX_SAFE_INTEGER). Received: -1"
		},
		{
			name: "should throw RangeError if fontSize exceeds MAX_SAFE_INTEGER",
			input: Number.MAX_SAFE_INTEGER + 1,
			expected: `Invalid: argument "fontSize" out of range (1 ~ MAX_SAFE_INTEGER). Received: ${Number.MAX_SAFE_INTEGER + 1}`
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration (Structure)
// =============================================================================

describe("setRootFontSize utility", () => {
	beforeEach(() => {
		// Clear inline styles before each test to ensure a clean state
		document.documentElement.removeAttribute("style");
		if (document.body) {
			document.body.removeAttribute("style");
		}
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Cleanup styles to prevent side effects in other tests
		document.documentElement.removeAttribute("style");
		if (document.body) {
			document.body.removeAttribute("style");
		}
	});

	describe("Success cases", () => {
		TestRunner.success(testData.successCases, null, (input: SuccessInput): SuccessExpected => {
			setRootFontSize(input.fontSize);

			const root = document.documentElement;
			const body = document.body;

			return {
				rootBaseFontSize: root.style.getPropertyValue("--base-font-size"),
				rootFontSize: root.style.getPropertyValue("font-size"),
				rootFontSizePriority: root.style.getPropertyPriority("font-size"),
				bodyFontSize: body.style.getPropertyValue("font-size"),
				bodyFontSizePriority: body.style.getPropertyPriority("font-size")
			};
		});
	});

	describe("Error handling", () => {
		TestRunner.error(testData.errorCases, null, (input) => {
			setRootFontSize(input);
		});

		/**
		 * @remarks
		 * This test case is implemented using a standard `it` block instead of `TestRunner`
		 * because it requires manipulating the global environment (`globalThis.document`)
		 * which is outside the scope of the declarative data-driven pattern.
		 */
		it("should throw Error if document is not defined", () => {
			// Arrange: Stub document as undefined
			vi.stubGlobal("document", undefined);

			try {
				// Act & Assert
				expect(() => setRootFontSize(16)).toThrow(
					"ERROR(util): 'document' is not defined. This function must be called in a browser environment."
				);
			} finally {
				// Restore global state
				vi.unstubAllGlobals();
			}
		});
	});
});