/**
 * Tests for ValidationRepair (Tab.customDelay.list)
 *
 * This test suite confirms that the validation rules for `Tab.customDelay.list`
 * execute non-destructive repair logic as expected.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { VerificationRules } from "@/assets/js/define/validation";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

/** A valid custom-delay item. */
const validItem1 = {
	id: "07db6a58-413e-47de-957d-afd1c8a64f85",
	enable: true,
	pattern: "https://example.com/",
	delay: 500,
};

const validItem2 = {
	id: "8f6a9cd0-d62e-4b70-a007-74de6299a50f",
	enable: false,
	pattern: "https://another.com/",
	delay: 250,
};

/** An item whose `pattern` field fails `canParseURL()` validation. */
const invalidItemBadPattern = {
	id: "00000000-0000-0000-0000-000000000001",
	enable: true,
	pattern: "NOT_A_URL",
	delay: 100,
};

/** An item whose `delay` value is out of the allowed range. */
const invalidItemBadDelay = {
	id: "00000000-0000-0000-0000-000000000002",
	enable: true,
	pattern: "https://example.org/",
	delay: 99999,  // exceeds TabOpenDelayValueMax
};

const testData = {
	success: [
		{
			name: "should not change an array with only valid items",
			input: [ validItem1, validItem2 ],
			expected: [ validItem1, validItem2 ]
		},
		{
			name: "should delete only items with invalid patterns",
			input: [ validItem1, invalidItemBadPattern, validItem2 ],
			expected: [ validItem1, validItem2 ]
		},
		{
			name: "should delete only items with invalid delays",
			input: [ validItem1, invalidItemBadDelay ],
			expected: [ validItem1 ]
		},
		{
			name: "should remove multiple invalid items and retain valid ones",
			input: [ invalidItemBadPattern, validItem1, invalidItemBadDelay, validItem2 ],
			expected: [ validItem1, validItem2 ]
		},
		{
			name: "should result in an empty array if all items are invalid",
			input: [ invalidItemBadPattern, invalidItemBadDelay ],
			expected: []
		},
		{
			name: "should allow an empty array as is",
			input: [],
			expected: []
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("ValidationRepair (Tab.customDelay.list)", () => {
	let rule: (value: unknown[]) => boolean;

	beforeEach(() => {
		const entry = VerificationRules.find(r => r.property === "Tab.customDelay.list");
		if (!entry) {
			throw new Error("Tab.customDelay.list rule not found");
		}
		rule = entry.rule as (value: unknown[]) => boolean;
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input) => {
		// Arrange
		const value = JSON.parse(JSON.stringify(input));

		// Act
		const result = rule(value);

		// Assert
		expect(result).toBe(true);
		return value; // TestRunner compares this with expected
	});

	it("should destructively change (splice) the original array instance and maintain the reference", () => {
		// Arrange
		const value = [ validItem1, invalidItemBadPattern ];
		const originalRef = value;

		// Act
		rule(value);

		// Assert
		expect(value).toBe(originalRef);
		expect(value).toHaveLength(1);
	});
});