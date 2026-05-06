/**
 * Tests for the setPageLanguage utility function.
 *
 * Verifies that the language attribute is correctly set on the HTML element
 * based on various browser language settings, including fallbacks.
 *
 * @file
 *
 * @see {@link project/src/assets/js/utils/setPageLanguage.ts} - The function under test
 * @see {@link project/docs/DeveloperGuide/vitest.md} - Vitest project standards
 */

import { describe, beforeEach, afterEach, expect, vi } from "vitest";
import { TestRunner, type TestCase } from "../../shared/support/TestRunner";

// =============================================================================
// 1. Module Mocking
// =============================================================================

/*
 * Mock the 'wxt/browser' module so that `import { browser } from "wxt/browser"`
 * in setPageLanguage.ts receives our controllable mock object.
 * Using `window.browser` directly does NOT work because the module binding is
 * captured at import time and is independent of the global `window` property.
 */
const mockGetUILanguage = vi.fn<() => string>();

vi.mock("wxt/browser", () => ({
	browser: {
		i18n: {
			getUILanguage: mockGetUILanguage,
		},
	},
}));

// Import AFTER vi.mock() so that the mocked module is used.
const { setPageLanguage } = await import("@/assets/js/utils/setPageLanguage");

// =============================================================================
// 2. Test Data (Separation of Data and Logic)
// =============================================================================

const testData = {
	successCases: [
		{
			name: "should set language to 'ja' for Japanese locale",
			input: {
				// browser.i18n.getUILanguage() returns 'ja'
				mockBrowserI18nReturnValue: "ja",
				mockNavigatorLanguage: "en-US"
			},
			expected: "ja"
		},
		{
			name: "should set language to 'en' for English locale",
			input: {
				mockBrowserI18nReturnValue: "en",
				mockNavigatorLanguage: "fr"
			},
			expected: "en"
		},
		{
			name: "should set language to 'en' for English US locale",
			input: {
				mockBrowserI18nReturnValue: "en-US",
				mockNavigatorLanguage: "fr"
			},
			expected: "en"
		},
		{
			name: "should fallback to navigator.language if browser.i18n is unavailable",
			input: {
				// Simulate browser.i18n not being available by making it throw
				mockBrowserI18nReturnValue: null, // null = make the mock throw
				mockNavigatorLanguage: "fr-FR"
			},
			expected: "fr"
		},
		{
			name: "should fallback to 'en' if both are unavailable or empty",
			input: {
				mockBrowserI18nReturnValue: null,
				mockNavigatorLanguage: "" // Empty navigator.language
			},
			expected: "en"
		},
		{
			name: "should handle undefined navigator.language gracefully",
			input: {
				mockBrowserI18nReturnValue: null,
				mockNavigatorLanguage: undefined // Undefined navigator.language
			},
			expected: "en"
		}
	],
	errorCases: []
} as const satisfies Record<string, readonly TestCase[]>;


// =============================================================================
// 3. Environment Setup
// =============================================================================

let mockHtmlElement: HTMLHtmlElement;
let originalDocumentQuerySelector: PropertyDescriptor | undefined;
let originalNavigatorLanguage: PropertyDescriptor | undefined;

// =============================================================================
// 4. Orchestration (Structure)
// =============================================================================

describe("setPageLanguage utility", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Create a detached <html> element to assert on lang attribute changes.
		mockHtmlElement = document.createElement("html");

		// Intercept document.querySelector to return our mock element.
		originalDocumentQuerySelector = Object.getOwnPropertyDescriptor(document, "querySelector");
		Object.defineProperty(document, "querySelector", {
			value: vi.fn().mockReturnValue(mockHtmlElement),
			configurable: true,
			writable: true,
		});

		// Save original navigator.language descriptor before each test.
		originalNavigatorLanguage = Object.getOwnPropertyDescriptor(window.navigator, "language");
	});

	afterEach(() => {
		vi.restoreAllMocks();

		// Restore document.querySelector
		if (originalDocumentQuerySelector) {
			Object.defineProperty(document, "querySelector", originalDocumentQuerySelector);
		}

		// Restore navigator.language
		if (originalNavigatorLanguage) {
			Object.defineProperty(window.navigator, "language", originalNavigatorLanguage);
		}
	});

	describe("Success cases", () => {
		TestRunner.success(testData.successCases, undefined, (input) => {
			// Set up browser.i18n mock: if null, make it throw to simulate unavailability.
			if (input.mockBrowserI18nReturnValue !== null) {
				mockGetUILanguage.mockReturnValue(input.mockBrowserI18nReturnValue as string);
			} else {
				mockGetUILanguage.mockImplementation(() => {
					throw new Error("browser.i18n unavailable");
				});
			}

			// Set up navigator.language mock.
			if (input.mockNavigatorLanguage !== undefined) {
				Object.defineProperty(window.navigator, "language", {
					value: input.mockNavigatorLanguage,
					configurable: true,
					writable: true,
				});
			} else {
				// Ensure the property doesn't exist for this test.
				Object.defineProperty(window.navigator, "language", {
					value: undefined,
					configurable: true,
					writable: true,
				});
			}

			setPageLanguage();

			return mockHtmlElement.getAttribute("lang");
		});
	});
});