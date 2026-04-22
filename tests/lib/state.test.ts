/**
 * Tests for state
 *
 * Verifies the shared store initialization function (`initializeSharedState`) provided by
 * `StateManager/state.svelte.ts` and the retrieval of initialized content.
 *
 * This is a test for a shared store with state, and since it includes side-effect verification
 * through state similar to DOM operations (e.g., object property reassignment control via freeze),
 * it uses individual 'it' blocks sequentially rather than data-driven testing via TestRunner.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, beforeEach, expect, vi } from "vitest";
import { shareStatus, updateState, initializeSharedState } from "@/assets/js/lib/user/StateManager/state.svelte";
import type { Config, Define } from "@/assets/js/types";

describe("state (StateManager)", () => {
	beforeEach(() => {
		vi.clearAllMocks();

		// Flow empty data to safely reset for each test
		// 'define' is excluded from reset because it is initialized with freeze: true, which cannot be undone.
		updateState([
			{ name: "config", value: {}, freeze: false }
		]);
	});

	it("should be able to set config and define via initializeSharedState", () => {
		const mockConfig = { Tab: { delay: 100 } } as Config;
		const mockDefine = { Environment: "test" } as unknown as Define;

		// Act
		initializeSharedState(mockConfig, mockDefine);

		// Assert
		expect(shareStatus.config).toEqual(mockConfig);
		expect(shareStatus.define).toEqual(mockDefine);
	});

	it("should not allow external changes to the 'define' property as it is frozen", () => {
		const mockConfig = { Tab: { delay: 100 } } as Config;
		const mockDefine = { Environment: "test" } as unknown as Define;
		initializeSharedState(mockConfig, mockDefine);

		const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

		// Act & Assert
		expect(() => {
			(shareStatus as any).define = { Environment: "new" };
		}).toThrow(TypeError);

		expect(shareStatus.define.Environment).toBe("test");
		expect(spy).toHaveBeenCalledWith(expect.stringContaining("attempted to write to frozen property"), expect.anything());
	});
});