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