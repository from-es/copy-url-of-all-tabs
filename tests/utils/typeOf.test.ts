/**
 * Tests for typeOf utility
 *
 * Verifies the accurate type name retrieval functionality provided by `typeOf.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { typeOf } from "@/assets/js/utils/typeOf";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		// Basic data types
		{ name: "should return 'string' for a string", input: "test", expected: "string" },
		{ name: "should return 'number' for a number", input: 123, expected: "number" },
		{ name: "should return 'number' for NaN", input: NaN, expected: "number" },
		{ name: "should return 'boolean' for boolean (true)", input: true, expected: "boolean" },
		{ name: "should return 'boolean' for boolean (false)", input: false, expected: "boolean" },
		{ name: "should return 'null' for null", input: null, expected: "null" },
		{ name: "should return 'undefined' for undefined", input: undefined, expected: "undefined" },
		{ name: "should return 'symbol' for a Symbol", input: Symbol("test"), expected: "symbol" },
		{ name: "should return 'bigint' for a BigInt", input: BigInt(100), expected: "bigint" },

		// Composite data types
		{ name: "should return 'array' for an array", input: [], expected: "array" },
		{ name: "should return 'object' for an object", input: {}, expected: "object" },
		{ name: "should return 'function' for a function", input: () => {}, expected: "function" },
		{ name: "should return 'date' for a Date object", input: new Date(), expected: "date" },
		{ name: "should return 'regexp' for a RegExp object", input: /test/, expected: "regexp" },
		{ name: "should return 'map' for a Map object", input: new Map(), expected: "map" },
		{ name: "should return 'set' for a Set object", input: new Set(), expected: "set" }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("typeOf", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		TestRunner.success(testData.success, null, (input) => {
			return typeOf(input);
		});
	});
});