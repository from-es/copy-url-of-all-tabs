/**
 * Tests for PopoverMessage
 *
 * Verifies the DOM behavior of custom components (component-popover-message) using the PopoverAPI,
 * and display processes such as the create method.
 *
 * Since the focus is mainly on side effects to DOM elements, this test uses individual 'it' blocks
 * instead of TestRunner.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { PopoverMessage } from "@/assets/js/lib/user/MessageManager/PopoverMessage";

describe("PopoverMessage", () => {
	beforeEach(() => {
		// Polyfill for PopoverAPI in JSDOM environment (simplified version)
		if (!HTMLElement.prototype.showPopover) {
			HTMLElement.prototype.showPopover = function() {
				this.dispatchEvent(new Event("toggle", { bubbles: false, cancelable: false }));
			};
		}
		if (!HTMLElement.prototype.hidePopover) {
			HTMLElement.prototype.hidePopover = function() {
				this.dispatchEvent(new Event("toggle", { bubbles: false, cancelable: false }));
			};
		}

		// DOM initialization
		document.body.innerHTML = "";
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.clearAllMocks();
	});

	it("should not display the popover if invalid arguments are passed", () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Act (invalid message options)
		expect(PopoverMessage.create({} as any)).toBeNull();
		expect(PopoverMessage.create(null as any)).toBeNull();
		expect(PopoverMessage.create({ message: 123 } as any)).toBeNull();
		expect(PopoverMessage.create({ message: [ 123 ] } as any)).toBeNull();

		// Invalid messagetype
		expect(PopoverMessage.create({ message: "a", messagetype: "invalid" as any })).toBeNull();

		// Invalid timeout
		expect(PopoverMessage.create({ message: "a", timeout: 0 })).toBeNull();
		expect(PopoverMessage.create({ message: "a", timeout: -1 })).toBeNull();
		expect(PopoverMessage.create({ message: "a", timeout: "5000" as any })).toBeNull();

		// Invalid fontsize
		expect(PopoverMessage.create({ message: "a", fontsize: 12 as any })).toBeNull();

		// Invalid color
		expect(PopoverMessage.create({ message: "a", color: "red" as any })).toBeNull();
		expect(PopoverMessage.create({ message: "a", color: { font: 123 as any } })).toBeNull();
		expect(PopoverMessage.create({ message: "a", color: { background: null as any } })).toBeNull();

		// Assert
		expect(spy).toHaveBeenCalled();
		expect(document.querySelectorAll("component-popover-message").length).toBe(0);
	});

	it("should generate an element and add it to document.body if valid arguments are passed", () => {
		// Act
		const element = PopoverMessage.create({
			message: "Test Message",
			messagetype: "success",
			timeout: 5000
		});

		// Assert
		expect(element).not.toBeNull();
		const popovers = document.querySelectorAll("component-popover-message");
		expect(popovers.length).toBe(1);

		// Verify that the element is removed upon timeout
		vi.runAllTimers();
		expect(document.querySelectorAll("component-popover-message").length).toBe(0);
	});

	it("should rotate and remove old messages if the message count exceeds the maximum (5)", () => {
		// Arrange & Act
		for (let i = 0; i < 6; i++) {
			PopoverMessage.create({ message: `Msg${i}`, timeout: 50000 });
		}

		// Assert
		// Since default.message.max is 5, only 5 are placed in the document.
		const popovers = document.querySelectorAll("component-popover-message");
		expect(popovers.length).toBe(5);
	});
});