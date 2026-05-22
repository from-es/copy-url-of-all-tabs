/**
 * Tests for createStore
 *
 * Verifies state management via the `createStore` function, specifically behaviors
 * for array updates (complete replacement instead of index-based merging) and
 * deep merging of objects.
 *
 * Standard `it` blocks are used for property freezing tests to handle complex assertions
 * involving `console.warn` mocks and `TypeError` expectations within Proxy traps.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, it, afterEach, expect, vi } from "vitest";
import { createStore, type StateOption } from "@/assets/js/lib/StateManager/store.svelte.ts";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{
			name: "arrays should be replaced with new arrays instead of being merged by index",
			input: {
				initial: [
					{ name: "list", freeze: false, value: { items: [ 1, 2, 3 ] } }
				] as StateOption[],
				updates: [
					{ name: "list", freeze: false, value: { items: [ 4, 5 ] } }
				] as StateOption[]
			},
			expected: { list: { items: [ 4, 5 ] } }
		},
		{
			name: "top-level arrays within the state object should also be correctly replaced",
			input: {
				initial: [
					{ name: "topLevelArray", freeze: false, value: [ "a", "b", "c" ] }
				] as StateOption[],
				updates: [
					{ name: "topLevelArray", freeze: false, value: [ "d" ] }
				] as StateOption[]
			},
			expected: { topLevelArray: [ "d" ] }
		},
		{
			name: "deep merge should be executed for objects other than arrays",
			input: {
				initial: [
					{
						name: "config",
						freeze: false,
						value: {
							nested: { keep: "me", change: "old" }
						}
					}
				] as StateOption[],
				updates: [
					{
						name: "config",
						freeze: false,
						value: {
							nested: { change: "new", add: "more" }
						}
					}
				] as StateOption[]
			},
			expected: {
				config: {
					nested: { keep: "me", change: "new", add: "more" }
				}
			}
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("createStore", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input) => {
		// Arrange
		const { shareStatus, updateState } = createStore(input.initial);

		// Act
		updateState(input.updates);

		// Assert
		return shareStatus;
	});

	describe("Property Freezing", () => {
		it("should not be able to update properties initialized with freeze: true via updateState", () => {
			// Arrange
			const initial: StateOption[] = [
				{ name: "frozenProp", freeze: true, value: { a: 1 } }
			];
			const { shareStatus, updateState } = createStore(initial);
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Act
			updateState([ { name: "frozenProp", freeze: false, value: { a: 2 } } ]);

			// Assert
			expect((shareStatus as IntentionalAnyForValidation).frozenProp.a).toBe(1);
			expect(spy).toHaveBeenCalledWith(expect.stringContaining("attempted to update frozen property"), expect.anything());
		});

		it("should not be able to directly update properties initialized with freeze: true via proxy", () => {
			// Arrange
			const initial: StateOption[] = [
				{ name: "frozenProp", freeze: true, value: { a: 1 } }
			];
			const { shareStatus } = createStore<IntentionalAnyForValidation>(initial);
			const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

			// Act & Assert: If Proxy's set trap returns false, TypeError is thrown in strict mode
			expect(() => {
				(shareStatus as IntentionalAnyForValidation).frozenProp = { a: 2 };
			}).toThrow(TypeError);

			// Assert
			expect((shareStatus as IntentionalAnyForValidation).frozenProp.a).toBe(1);
			expect(spy).toHaveBeenCalledWith(expect.stringContaining("attempted to write to frozen property"), expect.anything());
		});

		it("should not be able to directly update regular properties via proxy", () => {
			// Arrange
			const initial: StateOption[] = [
				{ name: "mutableProp", freeze: false, value: { a: 1 } }
			];
			const { shareStatus } = createStore<IntentionalAnyForValidation>(initial);

			// Act
			(shareStatus as IntentionalAnyForValidation).mutableProp = { a: 2 };

			// Assert
			expect((shareStatus as IntentionalAnyForValidation).mutableProp.a).toBe(2);
		});

		it("should prevent modification of nested objects in frozen properties", () => {
			// Arrange
			const initial: StateOption[] = [
				{
					name: "config",
					freeze: true,
					value: { theme: "dark", options: { notifications: true } }
				}
			];
			const { shareStatus } = createStore<IntentionalAnyForValidation>(initial);

			// Act & Assert
			expect(() => {
				(shareStatus as IntentionalAnyForValidation).config.theme = "light";
			}).toThrow(TypeError);

			expect(() => {
				(shareStatus as IntentionalAnyForValidation).config.options.notifications = false;
			}).toThrow(TypeError);

			expect((shareStatus as IntentionalAnyForValidation).config.theme).toBe("dark");
			expect((shareStatus as IntentionalAnyForValidation).config.options.notifications).toBe(true);
		});

		it("should not be affected by modifications to the original object (referential independence)", () => {
			// Arrange
			const myConfig = { theme: "dark" };
			const initial: StateOption[] = [
				{ name: "config", freeze: true, value: myConfig }
			];
			const { shareStatus } = createStore<IntentionalAnyForValidation>(initial);

			// Act
			myConfig.theme = "light";

			// Assert: The store should have its own copy
			expect((shareStatus as IntentionalAnyForValidation).config.theme).toBe("dark");
		});

		it("should not freeze the original object passed to the store", () => {
			// Arrange
			const myConfig = { theme: "dark" };
			const initial: StateOption[] = [
				{ name: "config", freeze: true, value: myConfig }
			];
			createStore<IntentionalAnyForValidation>(initial);

			// Act
			myConfig.theme = "light";

			// Assert: The original object should still be mutable
			expect(myConfig.theme).toBe("light");
			expect(Object.isFrozen(myConfig)).toBe(false);
		});
	});
});