/**
 * BadgeController Tests
 *
 * Verifies the behavior of the BadgeController class, including badge text updates,
 * color/theme management, task coalescing, and AbortSignal support.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 *
 * @description
 * This test uses standard 'it' blocks for complex asynchronous sequencing (timers, AbortSignal, p-queue)
 * that are not easily modeled as simple data-driven inputs in TestRunner.
 */

import { browser } from "wxt/browser";
import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { BadgeController } from "@/entrypoints/background/lib/BadgeController";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types/validation";

// =============================================================================
// 1. Test Data (Separation of Data and Logic)
// =============================================================================

const testData = {
	updateText: [
		{ name: "should set badge text when count is 10", input: "10", expected: "10" },
		{ name: "should set badge text when count is 999", input: "999", expected: "999" }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration (Structure)
// =============================================================================

// Mock wxt/browser: BadgeController requires storage and action APIs.
vi.mock("wxt/browser", () => ({
	browser: {
		storage: {
			local: {
				get: vi.fn().mockResolvedValue({}),
			},
		},
		action: {
			setBadgeText: vi.fn().mockResolvedValue(undefined),
			setBadgeTextColor: vi.fn().mockResolvedValue(undefined),
			setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
		},
	},
}));

describe("BadgeController", () => {
	let controller: BadgeController;

	beforeEach(async () => {
		// Arrange: Clear mocks and set up fake timers.
		vi.clearAllMocks();
		vi.useFakeTimers();

		// Initialize controller.
		controller = new BadgeController();

		// Enable badge for tests.
		controller.updateColor({
			enable: true,
			theme: { type: "light" }
		} as IntentionalAnyForValidation);

		// Process initialization and configuration updates.
		await vi.runAllTimersAsync();
		vi.clearAllMocks(); // Clear calls generated during setup.
	});

	afterEach(() => {
		// Cleanup: Restore real timers.
		vi.useRealTimers();
	});

	describe("Success cases (Basic updateText)", () => {
		TestRunner.success(testData.updateText, null, async (input) => {
			// Act
			controller.updateText(input);
			await vi.runAllTimersAsync();

			// Assert
			expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: input });
			return input;
		});
	});

	describe("Complex Behavioral Tests", () => {
		it("should coalesce rapid updates and only set the latest one", async () => {
			// Arrange
			controller.updateText("10");
			controller.updateText("20");

			// Act
			controller.updateText("30");
			await vi.runAllTimersAsync();

			// Assert
			const calls = (browser.action.setBadgeText as IntentionalAnyForValidation).mock.calls;
			expect(calls[calls.length - 1][0]).toEqual({ text: "30" });

			// Verify that intermediate update "20" was skipped.
			const texts = calls.map((c: IntentionalAnyForValidation) => c[0].text);
			expect(texts).not.toContain("20");
		});

		it("should display '0' then clear after wait", async () => {
			// Act
			controller.updateText("0");

			// Assert: Just before wait starts.
			await vi.advanceTimersByTimeAsync(0);
			expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "0" });

			// Act: Wait for the full waiting time (3 seconds).
			await vi.advanceTimersByTimeAsync(3000);
			await vi.runAllTimersAsync(); // Ensure queue finishes.

			// Assert: Badge should be cleared.
			expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
		});

		it("should abort clear if new text arrives during wait", async () => {
			// Arrange
			controller.updateText("0");
			await vi.advanceTimersByTimeAsync(1000);
			expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "0" });

			// Act: New text arrives during the 3s wait.
			controller.updateText("5");
			await vi.advanceTimersByTimeAsync(5000);
			await vi.runAllTimersAsync();

			// Assert: Latest text should be displayed, and clear operation should have been aborted.
			expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "5" });

			const calls = (browser.action.setBadgeText as IntentionalAnyForValidation).mock.calls;
			const zeroIndex = calls.findIndex((c: IntentionalAnyForValidation) => c[0].text === "0");
			const fiveIndex = calls.findIndex((c: IntentionalAnyForValidation) => c[0].text === "5");

			expect(zeroIndex).toBeLessThan(fiveIndex);
			// There should be no "" between "0" and "5".
			for (let i = zeroIndex + 1; i < fiveIndex; i++) {
				expect(calls[i][0].text).not.toBe("");
			}
		});

		it("should not set badge if disabled", async () => {
			// Arrange: Disable badge display.
			controller.updateColor({
				enable: false,
				theme: { type: "light" }
			} as IntentionalAnyForValidation);
			await vi.runAllTimersAsync();
			vi.clearAllMocks();

			// Act
			controller.updateText("10");
			await vi.runAllTimersAsync();

			// Assert
			expect(browser.action.setBadgeText).not.toHaveBeenCalled();
		});

		it("should clear badge if disabled during a task", async () => {
			// Act: Request update then immediately disable.
			controller.updateText("10");
			controller.updateColor({
				enable: false,
				theme: { type: "light" }
			} as IntentionalAnyForValidation);

			await vi.runAllTimersAsync();

			// Assert: The last operation should be a clear (setBadgeText("")).
			const calls = (browser.action.setBadgeText as IntentionalAnyForValidation).mock.calls;
			expect(calls[calls.length - 1][0]).toEqual({ text: "" });
		});
	});
});