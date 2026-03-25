/**
 * This file tests the `setSafeHTML`, `createSafeDOM`, and `createSafeHTML` utility functions,
 * which are responsible for safely injecting HTML into the DOM and creating sanitized
 * HTML/DOM objects to prevent XSS attacks.
 *
 * Purpose of Inspection:
 * - To verify that `createSafeHTML` correctly sanitizes HTML strings and handles
 *   various input types (null, undefined, non-strings).
 * - To ensure `createSafeDOM` returns a sanitized Document object.
 * - To confirm `setSafeHTML` properly clears and sets sanitized content in a target element.
 * - To check that appropriate errors are thrown for invalid arguments.
 *
 * @file
 * @lastModified 2026-03-25
 */

import { describe, it, expect, beforeEach } from "vitest";
import { setSafeHTML, createSafeDOM, createSafeHTML } from "../../src/assets/js/utils/setSafeHTML";

describe("setSafeHTML utilities", () => {
	describe("createSafeHTML", () => {
		it("should return an empty string for null", () => {
			expect(createSafeHTML(null)).toBe("");
		});

		it("should return an empty string for undefined", () => {
			expect(createSafeHTML(undefined)).toBe("");
		});

		it("should return an empty string for an empty string", () => {
			expect(createSafeHTML("")).toBe("");
		});

		it("should return an empty string for a whitespace string", () => {
			expect(createSafeHTML("   ")).toBe("");
		});

		it("should return a sanitized HTML string for valid input", () => {
			const input = "<div><script>alert(1)</script><p>Hello</p></div>";
			const output = createSafeHTML(input);
			expect(output).toBe("<div><p>Hello</p></div>");
		});

		it("should apply DOMPurify options (e.g., ALLOWED_TAGS)", () => {
			const input = "<div><p>Hello</p><b>Bold</b></div>";
			const options = { ALLOWED_TAGS: [ "p" ] };
			const output = createSafeHTML(input, options);
			expect(output).toBe("<p>Hello</p>Bold");
		});

		it("should throw TypeError if htmlString is not a string (and not empty)", () => {
			expect(() => createSafeHTML(123 as unknown as string)).toThrow(/must be a string/);
			expect(() => createSafeHTML({} as unknown as string)).toThrow(/must be a string/);
		});

		it("should throw TypeError if options is not an object", () => {
			expect(() => createSafeHTML("test", null as unknown as object)).toThrow(/must be an object/);
			expect(() => createSafeHTML("test", [] as unknown as object)).toThrow(/must be an object/);
			expect(() => createSafeHTML("test", 123 as unknown as object)).toThrow(/must be an object/);
		});
	});

	describe("createSafeDOM", () => {
		it("should return an empty Document for null", () => {
			const doc = createSafeDOM(null);
			expect(doc.body.innerHTML).toBe("");
		});

		it("should return an empty Document for undefined", () => {
			const doc = createSafeDOM(undefined);
			expect(doc.body.innerHTML).toBe("");
		});

		it("should return an empty Document for an empty string", () => {
			const doc = createSafeDOM("");
			expect(doc.body.innerHTML).toBe("");
		});

		it("should return an empty Document for a whitespace string", () => {
			const doc = createSafeDOM("   ");
			expect(doc.body.innerHTML).toBe("");
		});

		it("should return a sanitized Document for valid input", () => {
			const input = "<div><script>alert(1)</script><p>Hello</p></div>";
			const doc = createSafeDOM(input);
			expect(doc.body.innerHTML).toBe("<div><p>Hello</p></div>");
		});
	});

	describe("setSafeHTML", () => {
		let element: HTMLElement;

		beforeEach(() => {
			element = document.createElement("div");
			element.innerHTML = "<span>Original Content</span>";
		});

		it("should clear the element for null", () => {
			setSafeHTML(element, null);
			expect(element.innerHTML).toBe("");
		});

		it("should clear the element for undefined", () => {
			setSafeHTML(element, undefined);
			expect(element.innerHTML).toBe("");
		});

		it("should clear the element for an empty string", () => {
			setSafeHTML(element, "");
			expect(element.innerHTML).toBe("");
		});

		it("should clear the element for a whitespace string", () => {
			setSafeHTML(element, "   ");
			expect(element.innerHTML).toBe("");
		});

		it("should set sanitized content for valid input", () => {
			const input = "<div><script>alert(1)</script><p>Hello</p></div>";
			setSafeHTML(element, input);
			expect(element.innerHTML).toBe("<div><p>Hello</p></div>");
		});

		it("should handle multiple top-level nodes correctly", () => {
			const input = "<span>Node 1</span><span>Node 2</span>";
			setSafeHTML(element, input);
			expect(element.childNodes.length).toBe(2);
			expect(element.innerHTML).toBe("<span>Node 1</span><span>Node 2</span>");
		});

		it("should throw TypeError if element is not provided", () => {
			expect(() => setSafeHTML(null as unknown as Element, "test")).toThrow("Invalid: target element is not provided in setSafeHTML");
		});

		it("should throw TypeError if element is not an instance of Element", () => {
			expect(() => setSafeHTML({} as unknown as Element, "test")).toThrow("Invalid: target element must be an instance of Element in setSafeHTML");
		});
	});
});