/**
 * Tests for sanitizeForSendMessage utility
 *
 * Verifies the data cleansing functionality for MessagePassing (such as removing functions
 * that cannot be structured cloned), provided by `sanitizeForSendMessage.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { sanitizeForSendMessage } from "@/assets/js/utils/sanitizeForSendMessage";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{
			name: "should remove functions and symbols from an object",
			input: {
				aString: "Hello",
				aNumber: 123,
				aBoolean: true,
				anArray: [ 1, "two", { three: 3 } ],
				aFunction: () => "I am a function",
				aSymbol: Symbol("I am a symbol"),
				aNull: null,
				anUndefined: undefined,
				nested: {
					aValue: "nested value",
					aNestedFunction: () => "I am a nested function",
				},
			},
			expected: {
				aString: "Hello",
				aNumber: 123,
				aBoolean: true,
				anArray: [ 1, "two", { three: 3 } ],
				aNull: null,
				anUndefined: undefined,
				nested: {
					aValue: "nested value",
				},
			}
		},
		{
			name: "should not modify objects that are already serializable",
			input: {
				aString: "Hello",
				aNumber: 123,
				anArray: [ 1, 2, 3 ],
				nested: {
					aValue: "nested"
				}
			},
			expected: {
				aString: "Hello",
				aNumber: 123,
				anArray: [ 1, 2, 3 ],
				nested: {
					aValue: "nested"
				}
			}
		},
		{
			name: "should remove functions from an array of objects containing functions",
			input: [
				{ id: 1, action: () => "action 1" },
				{ id: 2, value: "serializable" },
				{ id: 3, action: () => "action 3" },
			],
			expected: [
				{ id: 1 },
				{ id: 2, value: "serializable" },
				{ id: 3 },
			]
		},
		{
			name: "should remove DOM nodes from an object containing nodes",
			input: {
				text: "some text",
				element: document.createElement("div"),
				nested: {
					span: document.createElement("span")
				}
			},
			expected: {
				text: "some text",
				nested: {}
			}
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("sanitizeForSendMessage", () => {
	let originalStructuredClone: any;

	beforeEach(() => {
		originalStructuredClone = globalThis.structuredClone;
	});

	afterEach(() => {
		globalThis.structuredClone = originalStructuredClone;
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input) => {
		// Arrange
		// In a JSDOM environment, structuredClone might be able to clone DOM nodes.
		// Therefore, we mock it to throw DataCloneError if property values contain functions or Nodes.
		globalThis.structuredClone = vi.fn().mockImplementation((data) => {
			const hasNonCloneable = (obj: any): boolean => {
				if (!obj || typeof obj !== "object") { return false; }
				for (const key in obj) {
					const val = obj[key];
					if (typeof val === "function" || typeof val === "symbol" || (typeof Node !== "undefined" && val instanceof Node)) { return true; }
					if (hasNonCloneable(val)) { return true; }
				}
				return false;
			};

			if (hasNonCloneable(data)) {
				const error = new Error("DataCloneError");
				error.name = "DataCloneError";
				throw error;
			}
			return originalStructuredClone(data);
		});

		// Act
		return sanitizeForSendMessage(input, { debug: true });
	});

	describe("Options", () => {
		it("should throw error if non-clonable properties are included when checkOnly is true", () => {
			// Arrange
			const data = { func: () => {} };

			// Act & Assert
			expect(() => sanitizeForSendMessage(data, { checkOnly: true })).toThrow("Invalid: data contains properties that cannot be structured cloned");
		});

		it("should output debug logs when debug is true", () => {
			// Arrange
			const data = { func: () => {} };
			const spy = vi.spyOn(console, "debug").mockImplementation(() => {});

			// Act
			sanitizeForSendMessage(data, { debug: true });

			// Assert
			expect(spy).toHaveBeenCalled();
		});
	});

	describe("Error Handling", () => {
		it("should throw an exception if structuredClone throws an error other than DataCloneError", () => {
			// Arrange
			const data = { a: 1 };
			const originalClone = globalThis.structuredClone;
			globalThis.structuredClone = vi.fn().mockImplementation(() => {
				throw new Error("Unexpected Error");
			});

			try {
				// Act & Assert
				expect(() => sanitizeForSendMessage(data)).toThrow("Exception: an unexpected error occurred");
			} finally {
				// Cleanup
				globalThis.structuredClone = originalClone;
			}
		});
	});
});