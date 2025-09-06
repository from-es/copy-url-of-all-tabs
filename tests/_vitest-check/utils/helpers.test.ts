/**
 * @file tests/_vitest-check/utils/helpers.test.ts
 * @description
 * This file serves as a smoke test to verify the basic functionality of helper functions
 * and to ensure that the Vitest testing environment is correctly configured for utility modules.
 * It specifically tests the `add` function from `./helpers` to confirm that:
 * 1. Basic arithmetic operations produce the correct results.
 * 2. The test runner can correctly import and execute tests for simple TypeScript/JavaScript modules.
 */
import { add } from "./helpers";
import { describe, it, expect } from "vitest";

describe("add function", () => {
	it("should return the sum of two numbers", () => {
		// Arrange
		const a = 1;
		const b = 2;

		// Act
		const result = add(a, b);

		// Assert
		expect(result).toBe(3);
	});

	it("should handle negative numbers", () => {
		expect(add(-1, -1)).toBe(-2);
	});
});
