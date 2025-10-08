import { describe, it, expect } from "vitest";
import { compareVersions } from "../../src/assets/js/utils/CompareVersions";

describe("compareVersions", () => {
	// Test cases for valid version strings
	describe("Valid version comparisons", () => {
		it("should return -1 when base > target (Major/Minor/Patch)", () => {
			expect(compareVersions("2.0.0", "1.9.9")).toBe(-1);
			expect(compareVersions("1.10.0", "1.9.10")).toBe(-1);
			expect(compareVersions("1.0.1", "1.0.0")).toBe(-1);
		});

		it("should return 1 when base < target (Major/Minor/Patch)", () => {
			expect(compareVersions("1.9.9", "2.0.0")).toBe(1);
			expect(compareVersions("1.9.10", "1.10.0")).toBe(1);
			expect(compareVersions("1.0.0", "1.0.1")).toBe(1);
		});

		it("should return 0 when base === target (Major/Minor/Patch)", () => {
			expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
			expect(compareVersions("2.3.4", "2.3.4")).toBe(0);
		});

		// Pre-release comparisons
		it("should correctly compare pre-release versions", () => {
			expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBe(1);
			expect(compareVersions("1.0.0-beta", "1.0.0-alpha")).toBe(-1);
			expect(compareVersions("1.0.0-alpha.1", "1.0.0-alpha.2")).toBe(1);
			expect(compareVersions("1.0.0-alpha.2", "1.0.0-alpha.1")).toBe(-1);
			expect(compareVersions("1.0.0-alpha.beta", "1.0.0-beta.alpha")).toBe(1);
			expect(compareVersions("1.0.0-rc.1", "1.0.0-rc.2")).toBe(1);
		});

		it("should prioritize stable versions over pre-release versions", () => {
			expect(compareVersions("1.0.0", "1.0.0-alpha")).toBe(-1);
			expect(compareVersions("1.0.0-alpha", "1.0.0")).toBe(1);
		});

		it("should handle numeric vs. string pre-release identifiers", () => {
			// Numeric identifiers have lower precedence than string identifiers
			expect(compareVersions("1.0.0-alpha.1", "1.0.0-alpha.a")).toBe(1);
			expect(compareVersions("1.0.0-alpha.a", "1.0.0-alpha.1")).toBe(-1);
		});

		it("should compare pre-release versions with different numbers of fields", () => {
			// A larger set of pre-release fields has a higher precedence
			expect(compareVersions("1.0.0-alpha.1", "1.0.0-alpha")).toBe(-1);
			expect(compareVersions("1.0.0-alpha", "1.0.0-alpha.1")).toBe(1);
		});

		it("should ignore build metadata", () => {
			expect(compareVersions("1.0.0+build1", "1.0.0+build2")).toBe(0);
			expect(compareVersions("1.0.0-alpha+build1", "1.0.0-alpha+build2")).toBe(0);
		});
	});

	// Test cases for invalid version strings
	describe("Invalid version string handling", () => {
		it("should throw an error for non-string inputs", () => {
			expect(() => compareVersions(null, "1.0.0")).toThrow();
			expect(() => compareVersions("1.0.0", undefined)).toThrow();
			expect(() => compareVersions(123, "1.0.0")).toThrow();
		});

		it("should throw an error for malformed version strings", () => {
			expect(() => compareVersions("1.0", "1.0.0")).toThrow();
			expect(() => compareVersions("1.0.0", "1.0.beta")).toThrow();
			expect(() => compareVersions("a.b.c", "1.0.0")).toThrow();
			expect(() => compareVersions("1.0.0", "1.0.0-.")).toThrow();
		});
	});

	describe("Prefixed or invalid format strings", () => {
		it("should throw an error for versions with prefixes", () => {
			expect(() => compareVersions("v1.0.0", "1.0.0")).toThrow();
			expect(() => compareVersions("1.0.0", "version 1.0.0")).toThrow();
		});

		it("should throw an error for versions with leading/trailing spaces", () => {
			expect(() => compareVersions(" 1.0.0", "1.0.0")).toThrow();
			expect(() => compareVersions("1.0.0", "1.0.0 ")).toThrow();
		});
	});

	describe("Malicious or Edge-case Inputs", () => {
		it("should throw an error for strings exceeding the length limit", () => {
			// Generate a string longer than 128 characters
			const longString = "1.0.0-" + "a.".repeat(70); // 146 chars
			expect(longString.length).toBeGreaterThan(128);
			// Expect the correct generic error message
			expect(() => compareVersions(longString, "1.0.0")).toThrow("Invalid input: One or both of the provided version strings are not valid semantic versions.");
		});

		it("should correctly handle near-limit-length strings that could cause ReDoS", () => {
			// A long, repetitive string (but within the length limit) that could potentially cause a ReDoS attack.
			// The fast completion of this test demonstrates that the ReDoS protection is effective.
			const potentialReDoS = "1.0.0-" + "a.".repeat(54) + "a"; // Prerelease part is 109 chars, total is 115.
			expect(potentialReDoS.length).toBeLessThanOrEqual(128);

			// Confirm that it does not throw an error.
			expect(() => compareVersions(potentialReDoS, "1.0.0")).not.toThrow();
			// Confirm it's correctly compared as a pre-release version (returns 1 since base < target).
			expect(compareVersions(potentialReDoS, "1.0.0")).toBe(1);
		});
	});
});