/**
 * Tests for getRuleBySelector utility
 *
 * Verifies the functionality to retrieve a corresponding CSSRule from a CSS selector,
 * provided by `getRuleBySelector.ts`.
 *
 * This test uses individual 'it' blocks because it sequentially verifies
 * the search process through dynamically generated stylesheets (CSSOM).
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { getRuleBySelector } from "@/assets/js/utils/getRuleBySelector";

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("getRuleBySelector Utility", () => {
	afterEach(() => {
		// Remove added style tags
		const styles = document.querySelectorAll("style");
		styles.forEach(style => style.remove());
		vi.clearAllMocks();
	});

	it("should retrieve the CSSRule that matches the specified selector", () => {
		// Arrange
		const style = document.createElement("style");
		style.textContent = ".test-class { color: red; } .other-class { display: none; }";
		document.head.appendChild(style);

		// Act
		const result = getRuleBySelector(".test-class") as CSSStyleRule;

		// Assert
		expect(result).not.toBeNull();
		expect(result.selectorText).toBe(".test-class");
		expect(result.style.color).toBe("red");
	});

	it("should search through all stylesheets if multiple ones exist", () => {
		// Arrange
		const style1 = document.createElement("style");
		style1.textContent = ".first { margin: 0; }";
		document.head.appendChild(style1);

		const style2 = document.createElement("style");
		style2.textContent = ".second { padding: 0; }";
		document.head.appendChild(style2);

		// Act
		const result1 = getRuleBySelector(".first");
		const result2 = getRuleBySelector(".second");

		// Assert
		expect(result1).not.toBeNull();
		expect(result2).not.toBeNull();
	});

	it("should return null if no matching selector is found", () => {
		// Arrange
		const style = document.createElement("style");
		style.textContent = ".existing { color: blue; }";
		document.head.appendChild(style);

		// Act
		const result = getRuleBySelector(".non-existing");

		// Assert
		expect(result).toBeNull();
	});

	it("should return null if no stylesheets exist", () => {
		// Act
		const result = getRuleBySelector(".anything");

		// Assert
		expect(result).toBeNull();
	});

	it("should throw TypeError if the argument is not a string", () => {
		expect(() => getRuleBySelector(123 as any)).toThrow(TypeError);
	});

	it("should throw TypeError if the argument is an empty string", () => {
		expect(() => getRuleBySelector("")).toThrow(TypeError);
	});

	it("should skip stylesheets with access restrictions (CORS)", () => {
		// Arrange: Mock a stylesheet that throws an error when accessing cssRules
		const originalStyleSheets = document.styleSheets;
		const mockSheet = {
			get cssRules() {
				throw new DOMException("The operation is insecure.", "SecurityError");
			},
			href: "https://cross-origin.com/style.css"
		};

		// Mock document.styleSheets
		Object.defineProperty(document, "styleSheets", {
			value: [ mockSheet ],
			configurable: true
		});

		const spy = vi.spyOn(console, "debug").mockImplementation(() => {});

		// Act
		const result = getRuleBySelector(".any");

		// Assert
		expect(result).toBeNull();
		expect(spy).toHaveBeenCalledWith(expect.stringContaining("Skipping stylesheet"), expect.anything());

		// Cleanup
		Object.defineProperty(document, "styleSheets", {
			value: originalStyleSheets,
			configurable: true
		});
	});
});