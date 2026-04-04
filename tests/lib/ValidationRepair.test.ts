/**
 * Test suite for the non-destructive validation repair logic in `validation.ts`.
 *
 * This file verifies that the `Tab.customDelay.list` validation rule:
 * - Removes only invalid items from the list.
 * - Preserves all valid items unchanged.
 * - Always returns `true` (accepts the repaired array).
 * - Leaves a fully valid array untouched.
 * - Handles edge cases such as empty arrays and fully invalid arrays.
 *
 * @file
 * @lastModified 2026-04-04
 */

import { describe, it, expect, vi } from "vitest";
import { VerificationRules }        from "@/assets/js/define/validation";

// Mock WXT's browser API module before importing modules that depend on it.
vi.mock("wxt/browser", () => ({
	browser: {
		runtime: {
			getManifest: vi.fn(() => ({
				author     : "From E",
				name       : "Copy URL of All Tabs",
				description: "A browser extension for copying all tab URLs.",
				version    : "1.0.0"
			})),
			id: "dummy-extension-id"
		}
	}
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Retrieves the validation rule function for `Tab.customDelay.list`
 * from the exported VerificationRules array.
 */
function getCustomDelayListRule(): (value: unknown[]) => boolean {  // eslint-disable-line no-unused-vars
	const entry = VerificationRules.find(r => r.property === "Tab.customDelay.list");
	if (!entry) {
		throw new Error("Tab.customDelay.list rule not found in VerificationRules");
	}
	return entry.rule as (value: unknown[]) => boolean;  // eslint-disable-line no-unused-vars
}

/**
 * Clones a value deeply using JSON serialisation (sufficient for plain data objects).
 */
function deepClone<T>(value: T): T {
	return JSON.parse(JSON.stringify(value));
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** A valid custom-delay item. */
const validItem1 = {
	id     : "07db6a58-413e-47de-957d-afd1c8a64f85",
	enable : true,
	pattern: "https://example.com/",
	delay  : 500,
};

const validItem2 = {
	id     : "8f6a9cd0-d62e-4b70-a007-74de6299a50f",
	enable : false,
	pattern: "https://another.com/",
	delay  : 250,
};

/** An item whose `pattern` field fails `canParseURL()` validation. */
const invalidItemBadPattern = {
	id     : "00000000-0000-0000-0000-000000000001",
	enable : true,
	pattern: "NOT_A_URL",
	delay  : 100,
};

/** An item whose `delay` value is out of the allowed range. */
const invalidItemBadDelay = {
	id     : "00000000-0000-0000-0000-000000000002",
	enable : true,
	pattern: "https://example.org/",
	delay  : 99999,  // exceeds TabOpenDelayValueMax
};

// ---------------------------------------------------------------------------
// Test Cases
// ---------------------------------------------------------------------------

describe("ValidationRepair (Tab.customDelay.list)", () => {
	it("should return true and leave a fully valid array untouched", () => {
		const rule  = getCustomDelayListRule();
		const value = deepClone([ validItem1, validItem2 ]);

		const result = rule(value);

		expect(result).toBe(true);
		expect(value).toHaveLength(2);
		expect(value[0]).toMatchObject(validItem1);
		expect(value[1]).toMatchObject(validItem2);
	});

	it("should return true and remove only the invalid item (bad pattern)", () => {
		const rule  = getCustomDelayListRule();
		const value = deepClone([ validItem1, invalidItemBadPattern, validItem2 ]);

		const result = rule(value);

		expect(result).toBe(true);
		// Only the 2 valid items should remain.
		expect(value).toHaveLength(2);
		expect(value).toEqual(expect.arrayContaining([
			expect.objectContaining({ id: validItem1.id }),
			expect.objectContaining({ id: validItem2.id }),
		]));
		// The bad item must be gone.
		expect(value).not.toEqual(expect.arrayContaining([
			expect.objectContaining({ id: invalidItemBadPattern.id }),
		]));
	});

	it("should return true and remove only the invalid item (bad delay)", () => {
		const rule  = getCustomDelayListRule();
		const value = deepClone([ validItem1, invalidItemBadDelay ]);

		const result = rule(value);

		expect(result).toBe(true);
		expect(value).toHaveLength(1);
		expect(value[0]).toMatchObject({ id: validItem1.id });
	});

	it("should return true and remove multiple invalid items while preserving valid ones", () => {
		const rule  = getCustomDelayListRule();
		const value = deepClone([
			invalidItemBadPattern,
			validItem1,
			invalidItemBadDelay,
			validItem2,
		]);

		const result = rule(value);

		expect(result).toBe(true);
		expect(value).toHaveLength(2);
		expect(value[0]).toMatchObject({ id: validItem1.id });
		expect(value[1]).toMatchObject({ id: validItem2.id });
	});

	it("should return true and produce an empty array when all items are invalid", () => {
		const rule  = getCustomDelayListRule();
		const value = deepClone([ invalidItemBadPattern, invalidItemBadDelay ]);

		const result = rule(value);

		expect(result).toBe(true);
		expect(value).toHaveLength(0);
	});

	it("should return true for an empty array (allowed by option.allowEmptyArray)", () => {
		const rule  = getCustomDelayListRule();
		const value: unknown[] = [];

		const result = rule(value);

		expect(result).toBe(true);
		expect(value).toHaveLength(0);
	});

	it("should mutate the original array reference in-place (splice), not replace it", () => {
		const rule          = getCustomDelayListRule();
		const value         = deepClone([ validItem1, invalidItemBadPattern ]);
		const originalRef   = value;  // Keep reference to the same array object.

		rule(value);

		// The array reference must be identical (splice preserves the reference).
		expect(value).toBe(originalRef);
		expect(value).toHaveLength(1);
	});
});