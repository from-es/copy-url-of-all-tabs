/**
 * @file sanitizeForSendMessage.test.ts
 * @lastupdate 2025-09-13
 * @description
 * This file tests the `sanitizeForSendMessage` utility function.
 *
 * The purpose of this function is to prepare an object to be sent via
 * `chrome.runtime.sendMessage` by removing properties that cannot be
 * serialized by the structured clone algorithm, such as functions and symbols.
 *
 * The tests verify three main scenarios:
 * 1. That non-serializable properties are correctly removed from a complex object.
 * 2. That an already-serializable object remains unchanged.
 * 3. That it correctly handles arrays containing objects with non-serializable properties.
 */

import { describe, it, expect } from "vitest";
import { sanitizeForSendMessage } from "@/assets/js/utils/sanitizeForSendMessage";

describe("sanitizeForSendMessage", () => {
	it("should remove non-serializable properties like functions and symbols", () => {
		// 1. Arrange: Create a complex object with non-serializable properties
		const originalObject = {
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
		};

		// 2. Act: Sanitize the object
		const sanitizedObject = sanitizeForSendMessage(originalObject);

		// 3. Assert: Check that non-serializable properties are removed
		expect(sanitizedObject).not.toHaveProperty("aFunction");
		expect(sanitizedObject).not.toHaveProperty("aSymbol");
		expect(sanitizedObject.nested).not.toHaveProperty("aNestedFunction");

		// Also check that serializable properties remain
		expect(sanitizedObject.aString).toBe("Hello");
		expect(sanitizedObject.aNumber).toBe(123);
		expect(sanitizedObject.anArray).toEqual([ 1, "two", { three: 3 } ]);
		expect(sanitizedObject.nested.aValue).toBe("nested value");

		// Check how it handles undefined
		// structuredClone supports undefined, so it should still be there.
		expect(sanitizedObject).toHaveProperty("anUndefined");
		expect(sanitizedObject.anUndefined).toBeUndefined();
	});

	it("should not modify an object that is already serializable", () => {
		const serializableObject = {
			aString: "Hello",
			aNumber: 123,
			anArray: [ 1, 2, 3 ],
			nested: {
				aValue: "nested"
			}
		};

		// Use structuredClone to create a deep copy for comparison
		const originalDeepCopy = structuredClone(serializableObject);

		const sanitizedObject = sanitizeForSendMessage(serializableObject);

		// The object should be deeply equal to the original
		expect(sanitizedObject).toEqual(originalDeepCopy);
	});

	it("should handle arrays of objects with non-serializable properties", () => {
		const arrayWithFunctions = [
			{ id: 1, action: () => "action 1" },
			{ id: 2, value: "serializable" },
			{ id: 3, action: () => "action 3" },
		];

		const sanitizedArray = sanitizeForSendMessage(arrayWithFunctions);

		expect(sanitizedArray[0]).not.toHaveProperty("action");
		expect(sanitizedArray[0].id).toBe(1);
		expect(sanitizedArray[1]).toEqual({ id: 2, value: "serializable" });
		expect(sanitizedArray[2]).not.toHaveProperty("action");
		expect(sanitizedArray[2].id).toBe(3);
	});
});