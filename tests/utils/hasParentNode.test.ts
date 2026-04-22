/**
 * Tests for hasParentNode utility
 *
 * Verifies the parent node checking and info retrieval functionality
 * provided by `hasParentNode.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { hasParentNode } from "@/assets/js/utils/hasParentNode";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	error: [
		{ name: "should throw TypeError when non-HTMLElement (null) is passed", input: [ null as IntentionalAnyForValidation ], expected: TypeError },
		{ name: "should throw TypeError when non-HTMLElement (number) is passed", input: [ 123 as IntentionalAnyForValidation ], expected: TypeError }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("hasParentNode Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		it("should return correct information when a parent node exists (div)", () => {
			// Arrange
			const parent = document.createElement("div");
			const child = document.createElement("span");
			parent.appendChild(child);

			// Act
			const result = hasParentNode(child);

			// Assert
			expect(result.elm).toBe(parent);
			expect(result.hasP).toBe(true);
			expect(result.name).toBe("div");
			expect(result.isA).toBe(false);
			expect(result.href).toBeUndefined();
		});

		it("should set isA to true and retrieve href when the parent node is an A tag", () => {
			// Arrange
			const parent = document.createElement("a");
			parent.href = "https://example.com/";
			const child = document.createElement("img");
			parent.appendChild(child);

			// Act
			const result = hasParentNode(child);

			// Assert
			expect(result.elm).toBe(parent);
			expect(result.isA).toBe(true);
			expect(result.href).toBe("https://example.com/");
		});

		it("should return empty information when no parent node exists", () => {
			// Arrange
			const standalone = document.createElement("div");

			// Act
			const result = hasParentNode(standalone);

			// Assert
			expect(result.elm).toBeNull();
			expect(result.hasP).toBe(false);
			expect(result.name).toBe("");
			expect(result.isA).toBe(false);
			expect(result.href).toBeUndefined();
		});
	});

	describe("Error cases", () => {
		TestRunner.error(testData.error, null, (input) => {
			return hasParentNode(input[0]);
		});
	});
});