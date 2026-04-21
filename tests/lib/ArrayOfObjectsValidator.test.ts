/**
 * Tests for ArrayOfObjectsValidator
 *
 * Verifies the validation functionality for objects in an array using v8n schemas,
 * provided by `ArrayOfObjectsValidator.ts`.
 *
 * @file
 *
 * @see {@link project/vitest.config.ts} - Common settings in test.setupFiles (auto-run)
 * @see {@link project/tests/shared/support/setup.ts} - Definitions of common mocks (browser, etc.)
 * @see {@link project/tests/shared/support/TestRunner.ts} - Common test execution infrastructure
 */

import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import v8n from "v8n";
import { ArrayOfObjectsValidator } from "@/assets/js/lib/user/ArrayOfObjectsValidator";
import { TestRunner, type TestCase } from "../shared/support/TestRunner";

// =============================================================================
// 1. Definition of test data
// =============================================================================

const schema = {
	id: v8n().string().not.empty(),
	value: v8n().number().between(0, 100)
};

const testData = {
	validate: {
		success: [
			{
				name: "should successfully validate an array of valid data",
				input: [ { id: "a", value: 10 }, { id: "b", value: 50 } ],
				expected: true
			},
			{
				name: "should correctly detect when some items are invalid",
				input: [ { id: "a", value: 10 }, { id: "", value: 50 }, { id: "c", value: 150 } ],
				expected: false
			},
			{
				name: "should skip validation and return success for an empty array",
				input: [],
				expected: true,
				setup: () => { vi.spyOn(console, "info").mockImplementation(() => {}); }
			},
			{
				name: "should apply default options",
				input: [ { id: "a", value: 10 } ],
				expected: true
			}
		],
		error: [
			{
				name: "should throw an exception if the data is not an array",
				input: "not-an-array",
				expected: "Exception: an unexpected error occurred during the validation process in ArrayOfObjectsValidator.validate"
			},
			{
				name: "should throw a TypeError for non-object elements when continueOnArrayTypeMismatch is false",
				input: { data: [ { id: "a", value: 10 }, 123 ], options: { continueOnArrayTypeMismatch: false } },
				expected: /Exception: an unexpected error occurred/
			},
			{
				name: "should throw a TypeError for missing keys when continueOnMissingKeys is false",
				input: { data: [ { value: 10 } ], options: { continueOnMissingKeys: false } },
				expected: /Exception: an unexpected error occurred/
			}
		]
	}
} as const satisfies Record<string, Record<string, readonly TestCase[]>>;

// =============================================================================
// 2. Orchestration
// =============================================================================

describe("ArrayOfObjectsValidator", () => {
	let validator: ArrayOfObjectsValidator;

	beforeEach(() => {
		// Arrange
		validator = new ArrayOfObjectsValidator();
	});

	afterEach(() => {
		// Cleanup
		vi.clearAllMocks();
	});

	describe("validate", () => {
		TestRunner.success(testData.validate.success, null, (input) => {
			const result = validator.validate(input, schema);
			return result.isAllValid;
		});

		TestRunner.error(testData.validate.error, null, (input) => {
			if (input && typeof input === "object" && "data" in input) {
				return validator.validate(input.data, schema, input.options);
			}
			return validator.validate(input, schema);
		});
	});

	describe("reportToConsole", () => {
		it("should output error if called before validation execution", () => {
			// Arrange
			const spy = vi.spyOn(console, "error").mockImplementation(() => {});

			// Act
			validator.reportToConsole();

			// Assert
			expect(spy).toHaveBeenCalledWith(expect.stringContaining("validation has not been run yet"));
		});

		it("should output information on successful validation", () => {
			// Arrange
			const spy = vi.spyOn(console, "info").mockImplementation(() => {});
			validator.validate([ { id: "a", value: 10 } ], schema);

			// Act
			validator.reportToConsole();

			// Assert
			expect(spy).toHaveBeenCalled();
		});

		it("should output details on failed validation", () => {
			// Arrange
			const spyGroup = vi.spyOn(console, "groupCollapsed").mockImplementation(() => {});
			const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
			validator.validate([ { id: "", value: 150 } ], schema);

			// Act
			validator.reportToConsole();

			// Assert
			expect(spyGroup).toHaveBeenCalled();
			expect(spyWarn).toHaveBeenCalled();
		});

		it("should output a warning and fallback when stringifiedRules is missing", () => {
			// Arrange: Force an invalid state
			validator.validate([], schema);
			const result = validator.test_lastResult;
			if (result) {
				(result.source.rules as any).stringified = null;
			}

			const spyWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
			const spyInfo = vi.spyOn(console, "info").mockImplementation(() => {});

			// Act
			validator.reportToConsole();

			// Assert
			expect(spyWarn).toHaveBeenCalledWith(expect.stringContaining("stringified' property is missing"));
			expect(spyInfo).toHaveBeenCalled();
		});
	});

	describe("stringifySchemaRules", () => {
		it("should correctly stringify rules", () => {
			// Act
			const result = ArrayOfObjectsValidator.stringifySchemaRules(schema);

			// Assert
			expect(result.id).toBeDefined();
			expect(typeof result.id).toBe("string");
		});

		it("should throw an exception when an invalid type is passed", () => {
			// Act & Assert
			expect(() => ArrayOfObjectsValidator.stringifySchemaRules(null as any)).toThrow(TypeError);
			expect(() => ArrayOfObjectsValidator.stringifySchemaRules(123 as any)).toThrow(TypeError);
			expect(() => ArrayOfObjectsValidator.stringifySchemaRules([]) as any).toThrow(TypeError);
		});

		it("should correctly stringify complex arguments (RegExp, Array, Object)", () => {
			const complexSchema = {
				regex: v8n().equal(/test/),
				array: v8n().not.equal([ 1, 2 ]),
				obj: v8n().not.equal({ a: 1 }),
				null: v8n().not.equal(null),
				undef: v8n().not.equal(undefined),
				bool: v8n().not.equal(true)
			};
			const result = ArrayOfObjectsValidator.stringifySchemaRules(complexSchema);
			expect(result.regex).toContain("/test/");
			expect(result.array).toContain("[ 1, 2 ]");
			expect(result.obj).toContain('{"a":1}');
			expect(result.null).toContain("null");
			expect(result.undef).toContain("undefined");
			expect(result.bool).toContain("true");
		});
	});

	describe("extractViolations (Internal)", () => {
		it("should correctly extract nested schema errors", () => {
			// Detailed test mimicking v8n internal structure
			const mockNestedError = {
				rule: { name: "schema" },
				violations: [
					{
						rule: { name: "schema" },
						param: {
							user: {
								rule: { name: "schema" },
								violations: [
									{ property: "name", rule: { name: "string" } }
								]
							}
						}
					}
				]
			};

			const violations = validator.test_extractViolations(mockNestedError);
			expect(violations.some(v => v.field === "user.name")).toBe(true);
		});

		it("should set field name based on ruleName if property is undefined", () => {
			// Mimic errors thrown by v8n
			const mockError = {
				rule: { name: "schema" },
				property: undefined
			};
			const violations = validator.test_extractViolations(mockError);
			expect(violations[0].field).toBe("schema_validation_failed");

			const mockError2 = {
				rule: { name: "other" },
				property: undefined
			};
			const violations2 = validator.test_extractViolations(mockError2);
			expect(violations2[0].field).toBe("unspecified_property");
		});

		it("should return an empty array if an invalid error object is passed", () => {
			expect(validator.test_extractViolations(null)).toEqual([]);
			expect(validator.test_extractViolations(123)).toEqual([]);
			expect(validator.test_extractViolations("error")).toEqual([]);
		});
	});
});