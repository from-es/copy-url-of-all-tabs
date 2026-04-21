/**
 * Smoke test for Counter.svelte
 *
 * Verifies that the test environment for rendering and basic operations
 * of Svelte components is correctly configured.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import Counter from "./Counter.svelte";
import { render, fireEvent, screen, cleanup } from "@testing-library/svelte";

describe("Counter.svelte (smoke test)", () => {
	afterEach(() => {
		cleanup();
		vi.clearAllMocks();
	});

	it("should display the correct count when mounted with an initial value of 0", () => {
		// Arrange
		render(Counter, { props: { count: 0 } });

		// Assert
		expect(screen.getByText("Current count: 0")).toBeTruthy();
	});

	it("should increment the count when the Increment button is clicked", async () => {
		// Arrange
		render(Counter, { props: { count: 0 } });
		const button = screen.getByText("Increment");

		// Act
		await fireEvent.click(button);

		// Assert
		expect(screen.getByText("Current count: 1")).toBeTruthy();

		// Act
		await fireEvent.click(button);

		// Assert
		expect(screen.getByText("Current count: 2")).toBeTruthy();
	});
});