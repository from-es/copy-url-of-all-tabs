/**
 * Tests for parseArrayOfCodeIntoUniqueID utility
 *
 * Verifies the functionality to detect ID duplication in objects within an array
 * and reassign unique IDs, provided by `parseArrayOfCodeIntoUniqueID.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, afterEach, vi } from "vitest";
import { parseArrayOfCodeIntoUniqueID } from "@/assets/js/utils/parseArrayOfCodeIntoUniqueID";
import * as generateIDModule from "@/assets/js/utils/generateID";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const testData = {
	success: [
		{
			name: "should return the array as is when there are no duplicates",
			input: [ { id: "id1", value: "val1" }, { id: "id2", value: "val2" } ],
			expected: [ { id: "id1", value: "val1" }, { id: "id2", value: "val2" } ]
		},
		{
			name: "should replace duplicate IDs with new unique IDs",
			input: [ { id: "dup", value: "val1" }, { id: "dup", value: "val2" }, { id: "unique", value: "val3" } ],
			expected: [ { id: "new-id", value: "val1" }, { id: "dup", value: "val2" }, { id: "unique", value: "val3" } ],
			setup: () => { vi.spyOn(generateIDModule, "generateID").mockReturnValue("new-id"); }
		},
		{
			name: "should keep one and replace all other IDs when there are three or more duplicates",
			input: [ { id: "dup" }, { id: "dup" }, { id: "dup" } ],
			expected: [ { id: "new-id-1" }, { id: "new-id-2" }, { id: "dup" } ],
			setup: () => {
				vi.spyOn(generateIDModule, "generateID")
					.mockReturnValueOnce("new-id-1")
					.mockReturnValueOnce("new-id-2");
			}
		},
		{
			name: "should return a new array (deep copy) without modifying the original array",
			input: [ { id: "id1" } ],
			expected: { isNewArray: true, isNewObject: true }
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("parseArrayOfCodeIntoUniqueID Utility", () => {
	afterEach(() => {
		vi.clearAllMocks();
	});

	TestRunner.success(testData.success, null, (input, _ctx, caseData) => {
		if (caseData.name.includes("deep copy")) {
			const result = parseArrayOfCodeIntoUniqueID(input);
			return {
				isNewArray: result !== input,
				isNewObject: result[0] !== input[0]
			};
		}
		return parseArrayOfCodeIntoUniqueID(input);
	});
});