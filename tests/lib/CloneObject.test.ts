/**
 * Tests for cloneObject utility
 *
 * Verifies the deep copy functionality combining structuredClone and cloneDeep,
 * provided by `CloneObject.ts`.
 *
 * This test uses individual 'it' blocks because it's necessary to verify
 * object duplication (ensuring references are different) individually.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { cloneObject } from "@/assets/js/lib/user/CloneObject";

describe("cloneObject Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should deep copy a simple object", () => {
		const obj = { a: 1, b: { c: 2 } };
		const result = cloneObject(obj);
		expect(result).toEqual(obj);
		expect(result).not.toBe(obj);
	});

	it("should fallback to cloneDeep and copy when values not supported by structuredClone (e.g., functions) are included", () => {
		const fn = () => "test";
		const obj = { a: 1, b: fn };

		// Simulate DataCloneError via mock
		const spy = vi.spyOn(global, "structuredClone").mockImplementation(() => {
			throw new DOMException("clone failed", "DataCloneError");
		});

		const result = cloneObject(obj);
		expect(result.b()).toBe("test");
		expect(result).not.toBe(obj);
		spy.mockRestore();
	});

	it("should also copy objects with circular references", () => {
		const obj: any = { a: 1 };
		obj.self = obj;
		const result = cloneObject(obj);
		expect(result.a).toBe(1);
		expect(result.self).toBe(result);
	});

	it("should copy using cloneDeep in environments where structuredClone is undefined", () => {
		// Temporarily delete structuredClone to simulate the environment
		const originalStructuredClone = global.structuredClone;
		// @ts-expect-error: Overwriting the environment for testing
		delete global.structuredClone;

		const obj = { a: 1, b: 2 };
		const result = cloneObject(obj);

		expect(result).toEqual(obj);
		expect(result).not.toBe(obj);

		// Restore environment
		global.structuredClone = originalStructuredClone;
	});

	it("should re-throw exceptions other than DataCloneError thrown by structuredClone", () => {
		vi.spyOn(global, "structuredClone").mockImplementation(() => {
			throw new Error("Unexpected error");
		});
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => cloneObject({ a: 1 })).toThrow("Exception: unexpected error occurred during object cloning");
		expect(consoleSpy).toHaveBeenCalled();
	});
});