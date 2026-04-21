/**
 * Tests for generateID utility
 *
 * Verifies the cryptographically secure random ID generation functionality
 * provided by `generateID.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, beforeAll, vi } from "vitest";
import { generateID } from "@/assets/js/utils/generateID";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 0. Environmental setup (Mocking crypto.getRandomValues)
// =============================================================================

beforeAll(() => {
	// Arrange
	if (typeof window !== "undefined" && !window.crypto) {
		// Act
		(window as any).crypto = {
			getRandomValues: (arr: any) => {
				for (let i = 0; i < arr.length; i++) {
					arr[i] = Math.floor(Math.random() * 0xFFFFFFFF);
				}
				return arr;
			}
		};
	}
});

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should generate an 8-character ID by default", input: [], expected: 8 },
		{ name: "should generate an ID of the specified length (16 characters)", input: [ 16 ], expected: 16 },
		{
			name: "should consist only of numbers when only 'number' is specified",
			input: [ 10, { number: true, alphabet: { uppercase: false, lowercase: false }, symbol: false } ],
			expected: /^[0-9]{10}$/
		},
		{
			name: "should consist only of uppercase alphabets when only 'uppercase' is specified",
			input: [ 10, { number: false, alphabet: { uppercase: true, lowercase: false }, symbol: false } ],
			expected: /^[A-Z]{10}$/
		},
		{
			name: "should consist only of lowercase alphabets when only 'lowercase' is specified",
			input: [ 10, { number: false, alphabet: { uppercase: false, lowercase: true }, symbol: false } ],
			expected: /^[a-z]{10}$/
		},
		{
			name: "should consist only of symbols when only 'symbol' is specified",
			input: [ 10, { number: false, alphabet: { uppercase: false, lowercase: false }, symbol: true } ],
			expected: /^[`~!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]{10}$/
		}
	],
	error: [
		{ name: "should throw TypeError when non-integer (1.5) is passed as length", input: [ 1.5 ], expected: TypeError },
		{ name: "should throw TypeError when a string is passed as length", input: [ "8" as any ], expected: TypeError },
		{ name: "should throw RangeError when length is 0 or less", input: [ 0 ], expected: RangeError },
		{ name: "should throw RangeError when length is a negative number", input: [ -1 ], expected: RangeError },
		{ name: "should throw TypeError when options are empty (all character types are false)", input: [ 8, { number: false } ], expected: TypeError },
		{ name: "should throw TypeError when options are not an object", input: [ 8, "invalid" as any ], expected: TypeError },
		{ name: "should throw TypeError when character.number is not a boolean", input: [ 8, { number: "true" as any } ], expected: TypeError },
		{ name: "should throw TypeError when character.alphabet.uppercase is not a boolean", input: [ 8, { alphabet: { uppercase: "true" as any } } ], expected: TypeError },
		{ name: "should throw TypeError when character.alphabet.lowercase is not a boolean", input: [ 8, { alphabet: { lowercase: "true" as any } } ], expected: TypeError },
		{ name: "should throw TypeError when character.symbol is not a boolean", input: [ 8, { symbol: "true" as any } ], expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("generateID Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		describe("ID Length", () => {
			TestRunner.success(testData.success.slice(0, 2), null, (input) => {
				const id = generateID(...(input as [any, any]));
				return id.length;
			});
		});

		// Character type verification
		describe("Character Types", () => {
			TestRunner.success(testData.success.slice(2), null, (input) => {
				// Arrange & Act
				const id = generateID(...(input as [any, any]));
				const expected = testData.success.find(c => c.input === input)?.expected;

				// Assert
				if (expected instanceof RegExp) {
					return expected.test(id) ? expected : id;
				}
				return id;
			});
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			// Act
			return generateID(...(input as [any, any]));
		});
	});
});