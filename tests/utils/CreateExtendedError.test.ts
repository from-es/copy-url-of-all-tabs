/**
 * Tests for createExtendedError utility
 *
 * Verifies the functionality for generating extended error objects
 * that can hold metadata, provided by `CreateExtendedError.ts`.
 *
 * This test uses individual 'it' blocks because it requires various types of verification
 * beyond object equality, such as type validation using toBeInstanceOf, stack trace
 * adjustments, and constructor type checks.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, expect } from "vitest";
import { createExtendedError } from "@/assets/js/utils/CreateExtendedError";

describe("createExtendedError", () => {
	it("should create a standard Error by default", () => {
		// Arrange
		const message = "test error";

		// Act
		const error = createExtendedError(Error, message);

		// Assert
		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe(message);
		expect(error.detail).toBeNull();
	});

	it("should attach arbitrary metadata properties within 'detail'", () => {
		// Arrange
		const category = "validation_error";
		const info     = { field: "email", value: "invalid" };

		// Act
		const error = createExtendedError(Error, "error", { category, information: info, custom: true });

		// Assert
		expect(error.detail).not.toBeNull();
		if (error.detail) {
			expect(error.detail.category).toBe(category);
			expect(error.detail.information).toEqual(info);
			expect(error.detail.custom).toBe(true);
		}
	});

	it("should set 'detail' to null if only 'cause' is provided", () => {
		// Arrange
		const cause = new Error("cause");

		// Act
		const error = createExtendedError(Error, "error", { cause });

		// Assert
		expect(error.cause).toBe(cause);
		expect(error.detail).toBeNull();
	});

	it("should support custom error types", () => {
		// Act
		const error = createExtendedError(TypeError, "type error");

		// Assert
		expect(error).toBeInstanceOf(TypeError);
		expect(error.message).toBe("type error");
	});

	it("should support Error Chaining (cause)", () => {
		// Arrange
		const cause = new Error("original cause");

		// Act
		const error = createExtendedError(Error, "wrapped error", { cause });

		// Assert
		expect(error.cause).toBe(cause);
	});

	it("should support non-Error object as cause", () => {
		// Arrange
		const stringCause = "something went wrong string";
		const objectCause = { reason: "timeout", code: 504 };
		const nullCause = null;

		// Act
		const errorWithString = createExtendedError(Error, "error with string cause", { cause: stringCause });
		const errorWithObject = createExtendedError(Error, "error with object cause", { cause: objectCause });
		const errorWithNull = createExtendedError(Error, "error with null cause", { cause: nullCause });

		// Assert
		expect(errorWithString.cause).toBe(stringCause);
		expect(errorWithObject.cause).toEqual(objectCause);
		expect(errorWithNull.cause).toBe(nullCause);
	});

	describe("Argument Validation", () => {
		it("should throw TypeError if message is not a string", () => {
			// Act & Assert
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, 123 as any)).toThrow("Invalid argument 'message': a non-empty string is required, but number was provided.");
		});

		it("should throw TypeError if message is an empty string", () => {
			// Act & Assert
			expect(() => createExtendedError(Error, "")).toThrow("Invalid argument 'message': a non-empty string is required, but string was provided.");
		});

		it("should throw TypeError if message is only whitespace", () => {
			// Act & Assert
			expect(() => createExtendedError(Error, "   ")).toThrow("Invalid argument 'message': a non-empty string is required, but string was provided.");
		});

		it("should throw TypeError if ErrorType is not a function", () => {
			// Act & Assert
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(123 as any, "test message")).toThrow("Invalid argument 'ErrorType': a constructor function is expected, but number was provided.");
		});

		it("should throw TypeError if ErrorType is not a valid Error constructor", () => {
			// Arrange
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const NotAnError: any = function() { return { not: "an error" }; };

			// Act & Assert
			expect(() => createExtendedError(NotAnError, "test message")).toThrow("Invalid argument 'ErrorType': must be a constructor that inherits from Error.");
		});

		it("should throw TypeError if options is not an object", () => {
			// Act & Assert
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, "msg", 123 as any)).toThrow("Invalid argument 'options': an object is expected, but number was provided.");
		});
	});

	describe("Stack Trace Control (stackStartFn)", () => {
		it("should allow disabling stack trace adjustment with null", () => {
			// Act
			const error = createExtendedError(Error, "no adjustment", { stackStartFn: null });

			// Assert
			expect(error.message).toBe("no adjustment");
		});

		it("should throw TypeError if stackStartFn is provided but is not a function/null/undefined", () => {
			// Act & Assert
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, "invalid stack", { stackStartFn: 123 } as any)).toThrow("Invalid option 'stackStartFn': a function, null, or undefined is expected, but number was provided.");
		});

		it("should accept a custom function for stackStartFn", () => {
			// Arrange
			const wrapper = () => createExtendedError(Error, "wrapper error", { stackStartFn: wrapper });

			// Act
			const error = wrapper();

			// Assert
			expect(error.message).toBe("wrapper error");
		});
	});
});