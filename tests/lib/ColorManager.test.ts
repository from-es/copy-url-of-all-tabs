/**
 * Tests for ColorManager
 *
 * Verifies the color validation functionality provided by `ColorManager/index.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { ColorManager } from "@/assets/js/lib/user/ColorManager";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{ name: "should identify a valid color name (red) as true", input: "red", expected: true },
		{ name: "should identify a valid hex color (#ffffff) as true", input: "#ffffff", expected: true },
		{ name: "should identify a valid rgb color (rgb(255, 255, 255)) as true", input: "rgb(255, 255, 255)", expected: true },
		{ name: "should identify an invalid string (not-a-color) as false", input: "not-a-color", expected: false },
		{ name: "should identify an empty string as false", input: "", expected: false }
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("ColorManager", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input) => {
		return ColorManager.isValidColor(input);
	});
});