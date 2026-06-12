/**
 * KeyboardStateManager Tests
 *
 * Verifies the generic abstraction layer for keyboard input management.
 * This test uses standard 'it' blocks because the KeyboardStateManager maintains
 * internal state and requires specific sequencing of actions (setup -> simulate press -> sync)
 * which is more readable in a procedural style than the declarative TestRunner pattern.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 */

import { describe, it, beforeEach, expect, vi } from "vitest";
import hotkeys from "hotkeys-js";
import { KeyboardStateManager } from "@/assets/js/lib/KeyboardStateManager";

// =============================================================================
// Mock hotkeys-js
// =============================================================================

const pressedKeys = new Set<string>();

vi.mock("hotkeys-js", () => ({
	default: Object.assign(
		(key: string, _handler: () => void) => {},
		{
			unbind           : vi.fn(),
			isPressed        : (key: string) => pressedKeys.has(key),
			__simulatePress  : (key: string) => pressedKeys.add(key),
			__simulateRelease: (key: string) => pressedKeys.delete(key),
			__clearAll       : () => pressedKeys.clear()
		}
	)
}));

// =============================================================================
// Orchestration (Structure)
// =============================================================================

describe("KeyboardStateManager", () => {
	let manager: KeyboardStateManager;

	beforeEach(() => {
		// Arrange: Standard preparation
		manager = new KeyboardStateManager();
		vi.clearAllMocks();

		// Reset internal mock state
		// @ts-expect-error - accessing mock helper
		hotkeys.__clearAll();
	});

	it("should initialize status as an empty set", () => {
		// Act
		manager.setup([ "w", "h", "none" ]);

		// Assert
		expect(manager.status).toBeInstanceOf(Set);
		expect(manager.status.size).toBe(0);
	});

	it("should sync states correctly from hotkeys-js", () => {
		// Arrange
		manager.setup([ "w", "a" ]);

		// Act & Assert 1: Press 'w'
		// @ts-expect-error - simulating press
		hotkeys.__simulatePress("w");
		manager.sync();
		expect(manager.status.has("w")).toBe(true);
		expect(manager.status.has("a")).toBe(false);

		// Act & Assert 2: Press 'a'
		// @ts-expect-error - simulating press
		hotkeys.__simulatePress("a");
		manager.sync();
		expect(manager.status.has("a")).toBe(true);

		// Act & Assert 3: Release 'w'
		// @ts-expect-error - simulating release
		hotkeys.__simulateRelease("w");
		manager.sync();
		expect(manager.status.has("w")).toBe(false);
		expect(manager.status.has("a")).toBe(true);
	});

	it("should reset all states to be empty", () => {
		// Arrange
		manager.setup([ "w", "h" ]);
		// Force set states manually
		manager.status.add("w");
		manager.status.add("h");

		// Act
		manager.reset();

		// Assert
		expect(manager.status.size).toBe(0);
	});

	it("should unbind handlers and clear status on teardown", () => {
		// Arrange
		manager.setup([ "w" ]);

		// Act
		manager.teardown();

		// Assert
		expect(hotkeys.unbind).toHaveBeenCalled();
		expect(manager.status.size).toBe(0);
	});
});