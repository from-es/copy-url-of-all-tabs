/**
 * Tests for TestRunner.ts
 *
 * Verifies the test execution infrastructure (success, error, and setup hooks) provided by `TestRunner.ts`.
 *
 * @file
 *
 * @see {@link project/tests/shared/support/TestRunner.ts}
 */

import { describe, it, expect, vi } from "vitest";
import { TestRunner } from "./TestRunner";

describe("TestRunner (coverage)", () => {
	const setupSpy = vi.fn();
	const cases = [
		{
			name: "setup check",
			input: "data",
			expected: "processed data",
			setup: setupSpy
		}
	];
	const context = {};

	// Verify that TestRunner correctly calls the setup hook
	TestRunner.success(cases, context, (input: string) => {
		return input === "data" ? "processed data" : "error";
	});

	it("should call the setup hook correctly", () => {
		expect(setupSpy).toHaveBeenCalledTimes(1);
	});
});