/**
 * Tests for VerifyConfigValue
 *
 * Verifies the configuration value validation and auto-correction functionality
 * provided by `VerifyConfigValue.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, beforeEach, afterEach, vi } from "vitest";
import { VerifyConfigValue } from "@/assets/js/lib/user/VerifyConfigValue";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";
import type { Config, Define } from "@/assets/js/types";

// =============================================================================
// 1. テストデータの定義
// =============================================================================

// Mock of a minimal Define object
const mockDefine = {
	Config: {
		key1: "default1",
		group: {
			key2: 100
		}
	},
	Verification: [
		{
			property: "key1",
			rule: (val: any) => typeof val === "string",
			fail: () => "default1"
		},
		{
			property: "group.key2",
			rule: (val: any) => typeof val === "number" && val > 0,
			fail: () => 100
		}
	]
} as unknown as Define;

const testData = {
	verify: {
		success: [
			{
				name: "should maintain valid configuration values as is",
				input: { key1: "valid string", group: { key2: 500 } },
				expected: { key1: "valid string", group: { key2: 500 } }
			},
			{
				name: "should overwrite invalid configuration values (wrong type) with default values",
				input: { key1: 123, group: { key2: 500 } },
				expected: { key1: "default1", group: { key2: 500 } }
			},
			{
				name: "should overwrite invalid configuration values (mismatched condition) with default values",
				input: { key1: "valid", group: { key2: -10 } },
				expected: { key1: "valid", group: { key2: 100 } }
			},
			{
				name: "should supplement with default values if properties are missing",
				input: { key1: "valid" },
				expected: { key1: "valid", group: { key2: 100 } }
			},
			{
				name: "should return default Config if the configuration object itself is invalid (null)",
				input: null,
				expected: mockDefine.Config,
				setup: () => { vi.spyOn(console, "error").mockImplementation(() => {}); }
			},
			{
				name: "should return default Config if the configuration object is empty",
				input: {},
				expected: mockDefine.Config
			}
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("VerifyConfigValue", () => {
	let verifier: VerifyConfigValue;

	beforeEach(() => {
		verifier = new VerifyConfigValue();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe("verify", () => {
		TestRunner.success(testData.verify.success, null, (input) => {
			return verifier.verify(input as unknown as Config, mockDefine);
		});
	});
});