/**
 * Smoke test for helpers utility
 *
 * This is a basic test to ensure that the Vitest execution environment is correctly configured.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { add } from "./helpers";
import { TestRunner, type TestCase } from "../../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should return the sum of two numbers", input: [ 1, 2 ], expected: 3 },
		{ name: "should handle negative numbers correctly", input: [ -1, -1 ], expected: -2 }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("add function (smoke test)", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input) => {
		return add(input[0], input[1]);
	});
});