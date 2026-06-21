/**
 * SequenceProcessor Core Module Tests
 *
 * Verifies processing sequence, condition checks, error rollbacks, and cloning behavior.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Global settings
 * @see {@link project/tests/shared/support/setup.ts} - Shared mocks
 * @see {@link project/tests/shared/support/TestRunner.ts} - Test execution engine
 * @see {@link project/tests/shared/types/validation.ts} - Standard type for validation tests
 */

import { describe, beforeEach, vi } from "vitest";
import { SequenceProcessor } from "@/assets/js/lib/SequenceProcessor";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import { type IntentionalAnyForValidation } from "../shared/types";

// =============================================================================
// 1. Test Data (Separation of Data and Logic)
// =============================================================================

const testData = {
	processCases: [
		{
			name: "should restore data if condition returns false to prevent mutation leaks",
			input: {
				data: { count: 0 },
				rules: [
					{
						meta: { name: "Leak Rule", description: { reason: "test" } },
						process: {
							condition: ({ data }: { data: { count: number } }) => {
								data.count = 999; // Mutation
								return false; // Skip
							},
							execute: ({ data }: { data: { count: number } }) => data
						}
					}
				]
			},
			expected: {
				count: 0,
				isApplied: false
			}
		},
		{
			name: "should apply mutations if condition returns true",
			input: {
				data: { count: 0 },
				rules: [
					{
						meta: { name: "Valid Rule", description: { reason: "test" } },
						process: {
							condition: ({ data }: { data: { count: number } }) => {
								data.count = 1; // Mutation allowed in condition if returning true
								return true;
							},
							execute: ({ data }: { data: { count: number } }) => {
								data.count += 1;
								return data;
							}
						}
					}
				]
			},
			expected: {
				count: 2,
				isApplied: true
			}
		},
		{
			name: "should handle module map in constructor",
			input: {
				data: { val: 0 },
				modules: {
					"rule1.ts": {
						rules: [
							{
								meta: { name: "Rule 1", description: { reason: "test" } },
								process: {
									condition: () => true,
									execute: ({ data }: { data: { val: number } }) => { data.val = 1; return data; }
								}
							}
						]
					}
				}
			},
			expected: {
				val: 1,
				isApplied: true
			}
		},
		{
			name: "should rollback completely on critical error",
			input: {
				data: { val: 0 },
				rules: [
					{
						meta: { name: "Success", description: { reason: "test" } },
						process: {
							condition: () => true,
							execute: ({ data }: { data: { val: number } }) => { data.val = 1; return data; }
						}
					},
					{
						meta: { name: "Fail", description: { reason: "test" } },
						spec: { critical: true },
						process: {
							condition: () => true,
							execute: () => { throw new Error("Boom"); }
						}
					}
				]
			},
			expected: {
				status: "failed",
				val: 0,
				isApplied: false,
				appliedCount: 0
			}
		},
		{
			name: "should default to structuredClone for deep cloning",
			input: {
				data: { val: { nested: 1 } },
				rules: [
					{
						meta: { name: "Clone Test", description: { reason: "test" } },
						process: {
							condition: () => true,
							execute: ({ data }: { data: { val: { nested: number } } }) => {
								data.val.nested = 2;
								return data;
							}
						}
					}
				]
			},
			expected: {
				nestedVal: 2,
				originalNestedVal: 1,
				isApplied: true
			}
		},
		{
			name: "should use custom cloneFn if provided in options",
			input: {
				data: { val: 1 },
				rules: [
					{
						meta: { name: "Custom Clone Test", description: { reason: "test" } },
						process: {
							condition: () => true,
							execute: ({ data }: { data: { val: number } }) => {
								data.val = 2;
								return data;
							}
						}
					}
				],
				useCustomClone: true
			},
			expected: {
				val: 2,
				cloneCalled: true,
				isApplied: true
			}
		}
	]
} as const satisfies Record<string, readonly TestCase[]>;

// =============================================================================
// 2. Orchestration (Structure)
// =============================================================================

describe("SequenceProcessor", () => {
	let context: IntentionalAnyForValidation;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Processing Behavior", () => {
		TestRunner.success(testData.processCases, context, async (input, ctx, caseData) => {
			let processor: SequenceProcessor<IntentionalAnyForValidation, IntentionalAnyForValidation>;
			if ("modules" in input) {
				processor = new SequenceProcessor(input.modules as IntentionalAnyForValidation);
			} else {
				processor = new SequenceProcessor(input.rules as IntentionalAnyForValidation);
			}

			let customCloneMock: IntentionalAnyForValidation;
			const options: IntentionalAnyForValidation = {};
			if ("useCustomClone" in input) {
				customCloneMock = vi.fn((obj) => ({ ...obj }));
				options.cloneFn = customCloneMock;
			}

			const originalInputRef = input.data;

			const result = await processor.process(input.data, {}, options);

			const returnData: IntentionalAnyForValidation = {};
			const expectedKeys = Object.keys(caseData.expected || {});

			if (expectedKeys.includes("count")) {
				returnData.count = result.data.count;
			}
			if (expectedKeys.includes("val")) {
				returnData.val = result.data.val;
			}
			if (expectedKeys.includes("nestedVal")) {
				returnData.nestedVal = result.data.val.nested;
			}
			if (expectedKeys.includes("originalNestedVal")) {
				returnData.originalNestedVal = (originalInputRef as IntentionalAnyForValidation).val.nested;
			}
			if (expectedKeys.includes("status")) {
				returnData.status = result.status;
			}
			if (expectedKeys.includes("isApplied")) {
				returnData.isApplied = result.isApplied;
			}
			if (expectedKeys.includes("appliedCount")) {
				returnData.appliedCount = result.appliedRules.length;
			}
			if (expectedKeys.includes("cloneCalled")) {
				returnData.cloneCalled = customCloneMock ? customCloneMock.mock.calls.length > 0 : false;
			}

			return returnData;
		});
	});
});