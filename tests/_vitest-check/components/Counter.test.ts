/**
 * @file tests/_vitest-check/components/Counter.test.ts
 * @description
 * This file serves as a smoke test for verifying Svelte component testing capabilities with Vitest.
 * It ensures that the `Counter.svelte` component:
 * 1. Renders correctly with initial props.
 * 2. Displays the initial state as expected.
 * 3. Responds appropriately to user interactions (e.g., button clicks).
 * This test helps confirm that the basic testing setup for Svelte components is functional.
 */
import { render, fireEvent, screen, cleanup } from "@testing-library/svelte";
import { describe, it, expect, afterEach } from "vitest";
import Counter from "./Counter.svelte";

describe("Counter.svelte", () => {
	// Clean up the DOM after each test to prevent side effects (e.g., state persistence) between tests.
	afterEach(() => cleanup());

	it("should mount the component and display the initial count correctly", () => {
		// 1. Arrange: Render the component under test with an initial value of 0.
		render(Counter, { props: { count: 0 } });

		// 2. Assert: Confirm that an element with the text "Current count: 0" exists.
		expect(screen.getByText("Current count: 0")).toBeTruthy();
	});

	it("should increment the count on button click", async () => {
		// 1. Arrange: Render the component with an initial value of 0.
		render(Counter, { props: { count: 0 } });
		const button = screen.getByText("Increment");

		// 2. Act: Click the button once.
		await fireEvent.click(button);

		// 3. Assert: Confirm that the count is now 1.
		expect(screen.getByText("Current count: 1")).toBeTruthy();

		// 4. Act: Click the button again.
		await fireEvent.click(button);

		// 5. Assert: Confirm that the count is now 2.
		expect(screen.getByText("Current count: 2")).toBeTruthy();
	});
});
