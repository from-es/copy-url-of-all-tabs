/**
 * Tests for setSafeHTML and related utilities
 *
 * Verifies secure HTML operation functionality using DOMPurify
 * (setSafeHTML, createSafeDOM, createSafeHTML), provided by `setSafeHTML.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, beforeEach, afterEach, vi } from "vitest";
import { setSafeHTML, createSafeDOM, createSafeHTML } from "@/assets/js/utils/setSafeHTML";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	createSafeHTML: {
		success: [
			{ name: "should return an empty string if null", input: null, expected: "" },
			{ name: "should return an empty string if undefined", input: undefined, expected: "" },
			{ name: "should return an empty string if empty string", input: "", expected: "" },
			{ name: "should return an empty string if whitespace string", input: "   ", expected: "" },
			{ name: "should return sanitized HTML for valid input", input: "<div><script>alert(1)</script><p>Hello</p></div>", expected: "<div><p>Hello</p></div>" },
			{
				name: "should apply DOMPurify options (ALLOWED_TAGS)",
				input: { html: "<div><p>Hello</p><b>Bold</b></div>", options: { ALLOWED_TAGS: [ "p" ] } },
				expected: "<p>Hello</p>Bold"
			}
		],
		error: [
			{ name: "should throw TypeError if htmlString is not a string", input: 123, expected: /must be a string/ },
			{ name: "should throw TypeError if options is not an object", input: { html: "test", options: 123 }, expected: /must be an object/ },
			{ name: "should throw TypeError if options is null", input: { html: "test", options: null }, expected: /must be an object/ }
		]
	},
	createSafeDOM: {
		success: [
			{ name: "should return an empty Document if null", input: null, expected: "" },
			{ name: "should return a sanitized Document for valid input", input: "<div><script>alert(1)</script><p>Hello</p></div>", expected: "<div><p>Hello</p></div>" }
		]
	},
	setSafeHTML: {
		success: [
			{ name: "should clear the element if null", input: null, expected: "" },
			{ name: "should set sanitized content for valid input", input: "<div><script>alert(1)</script><p>Hello</p></div>", expected: "<div><p>Hello</p></div>" },
			{ name: "should correctly handle multiple top-level nodes", input: "<span>Node 1</span><span>Node 2</span>", expected: "<span>Node 1</span><span>Node 2</span>" }
		],
		error: [
			{ name: "should throw an error if the element is not provided", input: { el: null, html: "test" }, expected: "Invalid: target element is not provided" },
			{ name: "should throw an error if the element is not an instance of Element", input: { el: {}, html: "test" }, expected: "Invalid: target element must be an instance of Element" }
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("setSafeHTML utilities", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("createSafeHTML", () => {
		TestRunner.success(testData.createSafeHTML.success, null, (input) => {
			if (input && typeof input === "object" && "html" in input) {
				return createSafeHTML(input.html as string, input.options as object);
			}
			return createSafeHTML(input);
		});

		TestRunner.error(testData.createSafeHTML.error, null, (input) => {
			if (input && typeof input === "object" && "html" in input) {
				return createSafeHTML(input.html as string, input.options as object);
			}
			return createSafeHTML(input);
		});
	});

	describe("createSafeDOM", () => {
		TestRunner.success(testData.createSafeDOM.success, null, (input) => {
			const doc = createSafeDOM(input);
			return doc.body.innerHTML;
		});
	});

	describe("setSafeHTML", () => {
		let element: HTMLElement;

		beforeEach(() => {
			element = document.createElement("div");
			element.innerHTML = "<span>Original Content</span>";
		});

		TestRunner.success(testData.setSafeHTML.success, null, (input) => {
			setSafeHTML(element, input);
			return element.innerHTML;
		});

		TestRunner.error(testData.setSafeHTML.error, null, (input) => {
			return setSafeHTML(input.el, input.html);
		});
	});
});