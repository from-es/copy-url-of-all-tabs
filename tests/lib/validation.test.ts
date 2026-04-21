/**
 * Comprehensive tests for VerificationRules
 *
 * Verifies validation rules for each property defined in `validation.ts`.
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

interface ValidationTestCase extends TestCase {
	property: string;
}

const testData = {
	information: {
		success: [
			{ name: "Information.name: string", property: "Information.name", input: "My Extension", expected: true },
			{ name: "Information.version: semver", property: "Information.version", input: "1.2.3", expected: true },
			{ name: "Information.version: semver with 4th part", property: "Information.version", input: "1.2.3.4", expected: true },
			{ name: "Information.date.timestamp: number", property: "Information.date.timestamp", input: 1625097600000, expected: true },
			{ name: "Information.date.timestamp: numeric string", property: "Information.date.timestamp", input: "1625097600000", expected: true },
			{ name: "Information.date.iso8601: string", property: "Information.date.iso8601", input: "2021-07-01T00:00:00.000Z", expected: true },
		],
		error: [
			{ name: "Information.version: invalid format", property: "Information.version", input: "1.2", expected: false },
			{ name: "Information.version: non-numeric", property: "Information.version", input: "a.b.c", expected: false },
			{ name: "Information.date.timestamp: null", property: "Information.date.timestamp", input: null, expected: false },
		]
	},
	optionsPage: {
		success: [
			{ name: "OptionsPage.fontsize: within range", property: "OptionsPage.fontsize", input: 14, expected: true },
			{ name: "OptionsPage.fontsize: numeric string", property: "OptionsPage.fontsize", input: "14", expected: true },
		],
		error: [
			{ name: "OptionsPage.fontsize: too small", property: "OptionsPage.fontsize", input: 1, expected: false },
			{ name: "OptionsPage.fontsize: too large", property: "OptionsPage.fontsize", input: 101, expected: false },
		]
	},
	popupMenu: {
		success: [
			{ name: "PopupMenu.fontsize: within range", property: "PopupMenu.fontsize", input: 12, expected: true },
			{ name: "PopupMenu.ClearMessage.enable: boolean", property: "PopupMenu.ClearMessage.enable", input: true, expected: true },
			{ name: "PopupMenu.ClearMessage.timeout: within range", property: "PopupMenu.ClearMessage.timeout", input: 30, expected: true },
		],
		error: [
			{ name: "PopupMenu.ClearMessage.timeout: too small", property: "PopupMenu.ClearMessage.timeout", input: -1, expected: false },
			{ name: "PopupMenu.ClearMessage.timeout: too large", property: "PopupMenu.ClearMessage.timeout", input: 61, expected: false },
		]
	},
	filtering: {
		success: [
			{ name: "Filtering.Deduplicate.Copy.enable", property: "Filtering.Deduplicate.Copy.enable", input: true, expected: true },
			{ name: "Filtering.Protocol.type: object", property: "Filtering.Protocol.type", input: {}, expected: true },
			{ name: "Filtering.Protocol.type.http", property: "Filtering.Protocol.type.http", input: true, expected: true },
			{ name: "Filtering.Protocol.type.chrome", property: "Filtering.Protocol.type.chrome", input: false, expected: true },
			{ name: "Filtering.PatternMatch.Copy.enable", property: "Filtering.PatternMatch.Copy.enable", input: true, expected: true },
			{ name: "Filtering.PatternMatch.type: prefix", property: "Filtering.PatternMatch.type", input: "prefix", expected: true },
			{ name: "Filtering.PatternMatch.type: regex", property: "Filtering.PatternMatch.type", input: "regex", expected: true },
			{ name: "Filtering.PatternMatch.pattern", property: "Filtering.PatternMatch.pattern", input: ".*", expected: true },
		],
		error: [
			{ name: "Filtering.PatternMatch.type: invalid", property: "Filtering.PatternMatch.type", input: "invalid", expected: false },
		]
	},
	format: {
		success: [
			{ name: "Format.type: text", property: "Format.type", input: "text", expected: true },
			{ name: "Format.template", property: "Format.template", input: "$url", expected: true },
			{ name: "Format.mimetype: text/plain", property: "Format.mimetype", input: "text/plain", expected: true },
			{ name: "Format.mimetype: text/html", property: "Format.mimetype", input: "text/html", expected: true },
		],
		error: [
			{ name: "Format.type: invalid", property: "Format.type", input: "invalid", expected: false },
			{ name: "Format.mimetype: invalid", property: "Format.mimetype", input: "application/json", expected: false },
		]
	},
	tab: {
		success: [
			{ name: "Tab.reverse", property: "Tab.reverse", input: true, expected: true },
			{ name: "Tab.active", property: "Tab.active", input: false, expected: true },
			{ name: "Tab.delay", property: "Tab.delay", input: 500, expected: true },
			{ name: "Tab.customDelay.enable", property: "Tab.customDelay.enable", input: true, expected: true },
			{ name: "Tab.position: default", property: "Tab.position", input: "default", expected: true },
			{ name: "Tab.position: last", property: "Tab.position", input: "last", expected: true },
			{ name: "Tab.TaskControl.openMode: parallel", property: "Tab.TaskControl.openMode", input: "parallel", expected: true },
			{ name: "Tab.TaskControl.taskMode: unitary", property: "Tab.TaskControl.taskMode", input: "unitary", expected: true },
			{ name: "Tab.TaskControl.chunkSize", property: "Tab.TaskControl.chunkSize", input: 10, expected: true },
		],
		error: [
			{ name: "Tab.position: invalid", property: "Tab.position", input: "invalid", expected: false },
			{ name: "Tab.TaskControl.openMode: invalid", property: "Tab.TaskControl.openMode", input: "invalid", expected: false },
			{ name: "Tab.customDelay.list: not an array", property: "Tab.customDelay.list", input: "not-an-array", expected: false },
		]
	},
	badge: {
		success: [
			{ name: "Badge.enable", property: "Badge.enable", input: true, expected: true },
			{ name: "Badge.theme: object", property: "Badge.theme", input: {}, expected: true },
			{ name: "Badge.theme.type: light", property: "Badge.theme.type", input: "light", expected: true },
			{ name: "Badge.theme.color: object", property: "Badge.theme.color", input: {}, expected: true },
			{ name: "Badge.theme.color.text: valid hex", property: "Badge.theme.color.text", input: "#FFFFFF", expected: true },
			{ name: "Badge.theme.color.background: valid name", property: "Badge.theme.color.background", input: "red", expected: true },
		],
		error: [
			{ name: "Badge.theme.type: invalid", property: "Badge.theme.type", input: "invalid", expected: false },
			{ name: "Badge.theme.color.text: invalid color", property: "Badge.theme.color.text", input: "not-a-color", expected: false },
		]
	},
	debug: {
		success: [
			{ name: "Debug.logging", property: "Debug.logging", input: true, expected: true },
			{ name: "Debug.loglevel: info", property: "Debug.loglevel", input: "info", expected: true },
			{ name: "Debug.loglevel: warn", property: "Debug.loglevel", input: "warn", expected: true },
			{ name: "Debug.methodLabel", property: "Debug.methodLabel", input: false, expected: true },
			{ name: "Debug.timestamp", property: "Debug.timestamp", input: true, expected: true },
			{ name: "Debug.timecoordinate: UTC", property: "Debug.timecoordinate", input: "UTC", expected: true },
		],
		error: [
			{ name: "Debug.loglevel: invalid", property: "Debug.loglevel", input: "invalid", expected: false },
			{ name: "Debug.timecoordinate: invalid", property: "Debug.timecoordinate", input: "JST", expected: false },
		]
	}
} as const satisfies Record<string, Record<string, readonly ValidationTestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("VerificationRules", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const targetFn = (input: any, _context: any, caseData: ValidationTestCase) => {
		const entry = VerificationRules.find(r => r.property === caseData.property);
		if (!entry) {
			throw new Error(`Rule for ${caseData.property} not found`);
		}
		return entry.rule(input);
	};

	describe("Information", () => {
		TestRunner.success([ ...testData.information.success, ...testData.information.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("OptionsPage", () => {
		TestRunner.success([ ...testData.optionsPage.success, ...testData.optionsPage.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("PopupMenu", () => {
		TestRunner.success([ ...testData.popupMenu.success, ...testData.popupMenu.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Filtering", () => {
		TestRunner.success([ ...testData.filtering.success, ...testData.filtering.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Format", () => {
		TestRunner.success([ ...testData.format.success, ...testData.format.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Tab", () => {
		TestRunner.success([ ...testData.tab.success, ...testData.tab.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Badge", () => {
		TestRunner.success([ ...testData.badge.success, ...testData.badge.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Debug", () => {
		TestRunner.success([ ...testData.debug.success, ...testData.debug.error ], null, (input, ctx, caseData) => targetFn(input, ctx, caseData));
	});

	describe("Global Consistency", () => {
		it("should verify the behavior of the fail function using manifest information", () => {
			const nameRule = VerificationRules.find(r => r.property === "Information.name");
			const versionRule = VerificationRules.find(r => r.property === "Information.version");

			expect(nameRule?.fail()).toBe("Copy URL of All Tabs");
			expect(versionRule?.fail()).toBe("1.20.8");
		});

		it("should verify consistency between the fail function and rule function for all rules", () => {
			VerificationRules.forEach((rule) => {
				const defaultValue = rule.fail();
				expect(defaultValue, `Property ${rule.property} fail() should return a defined value`).toBeDefined();

				// Should be valid with the default value
				const isValid = rule.rule(defaultValue);
				expect(isValid, `Property ${rule.property} default value should be valid`).toBe(true);
			});
		});
	});
});