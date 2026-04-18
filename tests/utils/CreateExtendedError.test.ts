/**
 * Test file for createExtendedError utility.
 *
 * @file
 * @lastModified 2026-04-18
 */

import { describe, it, expect } from "vitest";
import { createExtendedError } from "@/assets/js/utils/CreateExtendedError";

describe("createExtendedError", () => {
	it("should create a standard Error by default", () => {
		const message = "test error";
		const error   = createExtendedError(Error, message);

		expect(error).toBeInstanceOf(Error);
		expect(error.message).toBe(message);
		expect(error.detail).toBeNull();
	});

	it("should attach arbitrary metadata properties within 'detail'", () => {
		const category = "validation_error";
		const info     = { field: "email", value: "invalid" };
		const error    = createExtendedError(Error, "error", { category, information: info, custom: true });

		expect(error.detail).not.toBeNull();
		if (error.detail) {
			expect(error.detail.category).toBe(category);
			expect(error.detail.information).toEqual(info);
			expect(error.detail.custom).toBe(true);
		}
	});

	it("should set 'detail' to null if only 'cause' is provided", () => {
		const cause = new Error("cause");
		const error = createExtendedError(Error, "error", { cause });

		expect(error.cause).toBe(cause);
		expect(error.detail).toBeNull();
	});

	it("should support custom error types", () => {
		const error = createExtendedError(TypeError, "type error");

		expect(error).toBeInstanceOf(TypeError);
		expect(error.message).toBe("type error");
	});

	it("should support Error Chaining (cause)", () => {
		const cause = new Error("original cause");
		const error = createExtendedError(Error, "wrapped error", { cause });

		expect(error.cause).toBe(cause);
	});

	it("should support non-Error object as cause", () => {
		const stringCause = "something went wrong string";
		const errorWithString = createExtendedError(Error, "error with string cause", { cause: stringCause });
		expect(errorWithString.cause).toBe(stringCause);

		const objectCause = { reason: "timeout", code: 504 };
		const errorWithObject = createExtendedError(Error, "error with object cause", { cause: objectCause });
		expect(errorWithObject.cause).toEqual(objectCause);

		const nullCause = null;
		const errorWithNull = createExtendedError(Error, "error with null cause", { cause: nullCause });
		expect(errorWithNull.cause).toBe(nullCause);
	});

	describe("Argument Validation", () => {
		it("should throw TypeError if message is not a string", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, 123 as any)).toThrow("Invalid argument 'message': a non-empty string is required, but number was provided.");
		});

		it("should throw TypeError if message is an empty string", () => {
			expect(() => createExtendedError(Error, "")).toThrow("Invalid argument 'message': a non-empty string is required, but string was provided.");
		});

		it("should throw TypeError if message is only whitespace", () => {
			expect(() => createExtendedError(Error, "   ")).toThrow("Invalid argument 'message': a non-empty string is required, but string was provided.");
		});

		it("should throw TypeError if ErrorType is not a function", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(123 as any, "test message")).toThrow("Invalid argument 'ErrorType': a constructor function is expected, but number was provided.");
		});

		it("should throw TypeError if ErrorType is not a valid Error constructor", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const NotAnError: any = function() { return { not: "an error" }; };
			expect(() => createExtendedError(NotAnError, "test message")).toThrow("Invalid argument 'ErrorType': must be a constructor that inherits from Error.");
		});

		it("should throw TypeError if options is not an object", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, "msg", 123 as any)).toThrow("Invalid argument 'options': an object is expected, but number was provided.");
		});
	});

	describe("Stack Trace Control (stackStartFn)", () => {
		it("should allow disabling stack trace adjustment with null", () => {
			const error = createExtendedError(Error, "no adjustment", { stackStartFn: null });
			expect(error.message).toBe("no adjustment");
		});

		it("should throw TypeError if stackStartFn is provided but is not a function/null/undefined", () => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect(() => createExtendedError(Error, "invalid stack", { stackStartFn: 123 } as any)).toThrow("Invalid option 'stackStartFn': a function, null, or undefined is expected, but number was provided.");
		});

		it("should accept a custom function for stackStartFn", () => {
			const wrapper = () => createExtendedError(Error, "wrapper error", { stackStartFn: wrapper });
			const error = wrapper();
			expect(error.message).toBe("wrapper error");
		});
	});
});