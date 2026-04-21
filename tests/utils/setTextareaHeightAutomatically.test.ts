/**
 * Tests for setTextareaHeightAutomatically utility
 *
 * Verifies the automatic textarea height adjustment functionality
 * provided by `setTextareaHeightAutomatically.ts`.
 *
 * This test uses individual 'it' blocks because it verifies side effects
 * caused by the interaction between DOM events and the scrollHeight property.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { setTextareaHeightAutomatically } from "@/assets/js/utils/setTextareaHeightAutomatically";

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("setTextareaHeightAutomatically Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("Success cases", () => {
		it("should update textarea height based on scrollHeight", () => {
			// Arrange
			const textarea = document.createElement("textarea");
			Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 150 });
			const event = new Event("input", { bubbles: true });
			Object.defineProperty(event, "currentTarget", { configurable: true, value: textarea });

			// Act
			setTextareaHeightAutomatically(event);

			// Assert
			expect(textarea.style.height).toBe("150px");
		});

		it("should reset height to 'auto' once before setting the new height", () => {
			// Arrange
			const textarea = document.createElement("textarea");
			textarea.style.height = "500px";
			Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 150 });
			const setterSpy = vi.spyOn(textarea.style, "height", "set");
			const event = new Event("input", { bubbles: true });
			Object.defineProperty(event, "currentTarget", { configurable: true, value: textarea });

			// Act
			setTextareaHeightAutomatically(event);

			// Assert
			expect(setterSpy).toHaveBeenCalledWith("auto");
			expect(setterSpy).toHaveBeenLastCalledWith("150px");
		});
	});

	describe("Error cases", () => {
		it("should throw TypeError if event is not an instance of Event", () => {
			expect(() => setTextareaHeightAutomatically({} as any)).toThrow(TypeError);
		});

		it("should throw TypeError if event.currentTarget is not an instance of HTMLTextAreaElement", () => {
			const event = new Event("input");
			Object.defineProperty(event, "currentTarget", { value: document.createElement("div") });
			expect(() => setTextareaHeightAutomatically(event)).toThrow(TypeError);
		});
	});
});