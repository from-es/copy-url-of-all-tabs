/**
 * triggerKey Domain Logic Tests
 *
 * Verifies the calculation of query information and button labels based on keyboard modifier states.
 *
 * This test uses standard 'it' blocks rather than the Data-Driven Testing pattern (TestRunner)
 * because it requires sequential simulation of keyboard events (press/release) and
 * intermediate state assertions. These state transitions form a continuous sequence
 * that is difficult to represent as independent input-output pairs without sacrificing readability.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 */

import { describe, it, beforeEach, expect, vi } from "vitest";
import { setSharedState } from "@/assets/js/app/initializeSharedState.svelte.ts";
import { keyboard, getTriggerContext } from "@/entrypoints/popup/lib/triggerKey.svelte.ts";
import hotkeys from "hotkeys-js";
import { createMockConfig } from "../shared/fixtures/config";
import { createMockDefine } from "../shared/fixtures/define";

// Mock hotkeys-js
// Define the set inside the factory to avoid hoisting issues.
vi.mock("hotkeys-js", () => {
	const pressedKeys = new Set<string>();
	return {
		default: Object.assign(
			(key: string, handler: () => void) => {},
			{
				unbind: vi.fn(),
				isPressed: (key: string) => pressedKeys.has(key),
				__simulatePress: (key: string) => pressedKeys.add(key),
				__simulateRelease: (key: string) => pressedKeys.delete(key),
				__clearAll: () => pressedKeys.clear()
			}
		)
	};
});

describe("triggerKey domain logic", () => {
	beforeEach(() => {
		const config = createMockConfig({
			KeyBindings: {
				PopupMenu: {
					copy: { allWindows: "w", highlighted: "h" },
					paste: { reverse: "r", active: "a" }
				}
			},
			Tab: {
				reverse: false,
				active: false,
				delay: 250,
				customDelay: { enable: false, list: [] },
				position: "default",
				TaskControl: { taskMode: "unitary", openMode: "append", chunkSize: 5 }
			}
		});
		const define = createMockDefine(config);
		// Initial setup
		setSharedState(
			{ name: "config", value: config, freeze: false },
			{ name: "define", value: define, freeze: false }
		);
		keyboard.reset();
		keyboard.setup([ "w", "h", "r", "a" ]);
		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__clearAll();
	});

	it("should calculate correct queryInfo and label for copy actions", () => {
		// Mock initial tab query info by updating define in shared state if needed
		// or directly access in the test environment if possible,
		// but given the error, let's just make sure the state is initialized as expected
		// in the beforeEach.

		expect(getTriggerContext().queryInfo).toEqual({ currentWindow: true });
		expect(getTriggerContext().buttonLabel).toEqual({ Copy: null, Paste: null });

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulatePress("w");
		keyboard.sync();
		expect(getTriggerContext().queryInfo).toEqual({});
		expect(getTriggerContext().buttonLabel).toEqual({ Copy: "All Windows", Paste: null });

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulatePress("h");
		keyboard.sync();
		expect(getTriggerContext().queryInfo).toEqual({ highlighted: true });
		expect(getTriggerContext().buttonLabel).toEqual({ Copy: "All Window,Highlighte", Paste: null });

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulateRelease("w");
		keyboard.sync();
		expect(getTriggerContext().queryInfo).toEqual({ currentWindow: true, highlighted: true });
		expect(getTriggerContext().buttonLabel).toEqual({ Copy: "Highlighted", Paste: null });
	});

	it("should calculate correct overrides and labels for paste actions", () => {
		expect(getTriggerContext().pasteOverrides).toEqual({ reverse: false, active: false });
		expect(getTriggerContext().buttonLabel.Paste).toBeNull();

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulatePress("r");
		keyboard.sync();
		expect(getTriggerContext().pasteOverrides.reverse).toBe(true);
		expect(getTriggerContext().buttonLabel.Paste).toBe("Reverse");

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulatePress("a");
		keyboard.sync();
		expect(getTriggerContext().pasteOverrides.active).toBe(true);
		expect(getTriggerContext().buttonLabel.Paste).toBe("Active,Reverse");

		// @ts-expect-error - The 'hotkeys' mock includes custom simulation methods not present in the original library's type definitions.
		hotkeys.__simulateRelease("r");
		keyboard.sync();
		expect(getTriggerContext().pasteOverrides.reverse).toBe(false);
		expect(getTriggerContext().buttonLabel.Paste).toBe("Active");
	});
});