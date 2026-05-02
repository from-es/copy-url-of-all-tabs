/**
 * Utility to validate objects in an array using v8n schemas.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import NPM Package
import v8n from "v8n";



/**
 * Validator options and results type definitions.
 */
interface ValidatorOption {
	/**
	 * Whether to allow an empty array.
	 */
	allowEmptyArray: boolean;
	/**
	 * Whether to continue validation if the array element is not an object.
	 */
	continueOnArrayTypeMismatch: boolean;
	/**
	 * Whether to continue validation if required keys are missing from an object.
	 */
	continueOnMissingKeys: boolean;
}

/**
 * Information about a validation rule violation.
 */
interface ValidationViolation {
	/**
	 * The name of the field that failed validation.
	 */
	field: string;
	/**
	 * The name of the rule that was violated.
	 */
	rule: string;
}

/**
 * Result of validating a single item in the array.
 */
interface ValidationItemResult {
	/**
	 * Whether the item is valid.
	 */
	isValid: boolean;
	/**
	 * The item that was validated.
	 */
	item: unknown;
	/**
	 * The index of the item in the array.
	 */
	index: number;
	/**
	 * A list of violations found for this item.
	 */
	violations: ValidationViolation[];
}

/**
 * The final result of validating an entire array.
 */
interface ValidationFinalResult {
	/**
	 * Whether all items in the array are valid.
	 */
	isAllValid: boolean;
	/**
	 * A list of items that failed validation.
	 */
	invalidItems: ValidationItemResult[];
	/**
	 * Information about the original data and rules.
	 */
	source: {
		/**
		 * The original array data.
		 */
		data: unknown[];
		/**
		 * The rules used for validation.
		 */
		rules: {
			/**
			 * The original v8n schema rules.
			 */
			original: unknown;
			/**
			 * Stringified representations of the v8n rules.
			 */
			stringified: Record<string, string>;
		};
	};
}



/**
 * Class that validates each object in an array against a v8n schema.
 */
export class ArrayOfObjectsValidator {
	#option: ValidatorOption = {
		allowEmptyArray            : true,  // Allow empty arrays
		continueOnArrayTypeMismatch: true,  // For debugging, recommended to set to false for production builds
		continueOnMissingKeys      : true,  // For debugging, recommended to set to false for production builds
	};
	#lastResult: ValidationFinalResult | null = null;

	constructor() {
		// nothing
	}

	/**
	 * For testing purposes only.
	 * Returns the internal state of the last validation result.
	 */
	get test_lastResult(): ValidationFinalResult | null {
		return this.#lastResult;
	}

	/**
	 * For testing purposes only.
	 * Exposes the internal extractViolations method.
	 */
	test_extractViolations(error: unknown): ValidationViolation[] {
		return this.#extractViolations(error);
	}

	/**
	 * Helper for #stringifySingleV8nRule to recursively stringify arguments.
	 *
	 * @param   {unknown} arg - The argument to stringify.
	 * @returns {string}        The string representation of the argument.
	 */
	static #stringifySingleV8nRuleArg(arg: unknown): string {
		if (typeof arg === "string") {
			return `'${arg}'`;
		} else if (arg instanceof RegExp) {
			return arg.toString();
		} else if (arg === null) {
			return "null";
		} else if (arg === undefined) {
			return "undefined";
		} else if (Array.isArray(arg)) {
			// Recursively handle arrays within arguments
			return `[ ${arg.map(ArrayOfObjectsValidator.#stringifySingleV8nRuleArg).join(", ")} ]`;
		} else if (typeof arg === "object") {
			// For plain objects, JSON.stringify is a reasonable fallback.
			return JSON.stringify(arg);
		} else {
			return String(arg);
		}
	}

	/**
	 * Converts a v8n rule object into its string representation.
	 *
	 * @param   {unknown} ruleObject - The internal v8n rule object (e.g., rules.url).
	 * @returns {string}               The string representation of the v8n rule chain.
	 */
	static #stringifySingleV8nRule(ruleObject: unknown): string {
		const ruleObj = ruleObject as { chain?: Array<{ name?: string; args?: unknown[] }> } | null;

		if (!ruleObj || !Array.isArray(ruleObj.chain)) {
			return "Invalid v8n rule object structure";
		}

		let result = "v8n()";

		ruleObj.chain.forEach(
			(rule) => {
				let methodName = rule?.name;
				const args = rule?.args ?? [];

				if (methodName === undefined) {
					console.warn("WARN(validation): Invalid: v8n rule object is missing 'name' property", { rule });
					methodName = "unknownRule";
				}

				if (args.length > 0) {
					const serializedArgs = args.map(ArrayOfObjectsValidator.#stringifySingleV8nRuleArg).join(", ");
					result += `.${methodName}(${serializedArgs})`;
				} else {
					result += `.${methodName}()`;
				}
			}
		);

		return result;
	}

	/**
	 * Converts a schema rules object into an object with stringified v8n rule representations.
	 *
	 * @param   {unknown}                schemaRules - The v8n schema rules object (e.g., { url: v8n()..., delay: v8n()... }).
	 * @returns {Record<string, string>}               An object where keys are field names and values are stringified v8n rules.
	 */
	static stringifySchemaRules(schemaRules: unknown): Record<string, string> {
		if (typeof schemaRules !== "object" || schemaRules === null || Array.isArray(schemaRules)) {
			throw new TypeError("Invalid: the 'schemaRules' argument must be a non-null object in ArrayOfObjectsValidator.stringifySchemaRules");
		}

		const schemaRulesObj                      = schemaRules as Record<string, unknown>;
		const stringified: Record<string, string> = {};

		for (const key in schemaRulesObj) {
			if (Object.hasOwn(schemaRulesObj, key)) {
				stringified[key] = ArrayOfObjectsValidator.#stringifySingleV8nRule(schemaRulesObj[key]);
			}
		}

		return stringified;
	}

	/**
	 * Flattens nested v8n error information into a single array.
	 *
	 * @param   {unknown}               error - The error object thrown by v8n.
	 * @returns {ValidationViolation[]}         An array of violation information.
	 */
	#extractViolations(error: unknown): ValidationViolation[] {
		const result: ValidationViolation[] = [];

		if (!error || typeof error !== "object") {
			return result;
		}

		const err = error as {
			violations?: Array<{
				property?: string;
				rule    ?: { name?: string };
				param   ?: Record<string, unknown>;
			}>;
			property?: string;
			rule    ?: { name?: string };
		};

		if (!Array.isArray(err.violations)) {
			let   fieldName = err.property;
			const ruleName  = err.rule?.name;

			if (fieldName === undefined) {
				fieldName = ruleName === "schema" ? "schema_validation_failed" : "unspecified_property";
			}
			if (fieldName || ruleName) {
				result.push({ field: fieldName, rule: ruleName ?? "unknown" });
			}

			return result;
		}

		err.violations.forEach((violation) => {
			if (violation.rule?.name === "schema" && violation.param && typeof violation.param === "object") {
				for (const key in violation.param) {
					const nestedError      = violation.param[key];
					const nestedViolations = this.#extractViolations(nestedError);

					nestedViolations.forEach(nestedViolation => {
						const fieldName = nestedViolation.field === "unspecified_property" ? "" : `.${nestedViolation.field}`;
						result.push({ field: `${key}${fieldName}`, rule: nestedViolation.rule });
					});
				}
			} else {
				result.push({ field: violation.property ?? "unspecified_property", rule: violation.rule?.name ?? "unknown" });
			}
		});

		return result;
	}

	/**
	 * Validates and ensures the 'option' argument has correct structure and types.
	 *
	 * @param   {Partial<ValidatorOption>} option - The options object to validate.
	 * @returns {void}
	 * @throws  {TypeError}                         If `option` is not a valid object.
	 */
	#ensureDataValidOption(option: Partial<ValidatorOption>): void {
		if (!(option && typeof option === "object")) {
			throw new TypeError("Invalid: the 'option' argument must be an object in ArrayOfObjectsValidator.#ensureDataValidOption");
		}

		// Set default value
		if (option.allowEmptyArray === undefined) {
			option.allowEmptyArray = true;
		}
		if (option.continueOnArrayTypeMismatch === undefined) {
			option.continueOnArrayTypeMismatch = true;
		}
		if (option.continueOnMissingKeys === undefined) {
			option.continueOnMissingKeys = true;
		}
	}

	/**
	 * Validates the data and schemaRules arguments.
	 *
	 * @param   {unknown} schemaRules - The v8n schema object.
	 * @returns {unknown}               The v8n validation object.
	 * @throws  {Error}                 If `schemaRules` is not a valid v8n schema.
	 */
	#validateArguments(schemaRules: unknown): unknown {
		// Validate 'schemaRules' argument
		try {
			// @ts-expect-error: v8n types may not be fully recognized
			return v8n().schema(schemaRules);
		} catch (error) {
			throw new Error(`Invalid: the 'schemaRules' argument is not a valid v8n schema in ArrayOfObjectsValidator.#validateArguments`, { cause: error });
		}
	}

	/**
	 * Checks if an item in the array is a non-null object.
	 *
	 * @param   {unknown}                      item   - The item to check.
	 * @param   {number}                       index  - The index of the item in the original array.
	 * @param   {ValidatorOption}              option - Validation options.
	 * @returns {ValidationViolation[] | null}          An array of violations if the item is invalid, otherwise null.
	 * @throws  {TypeError}                             If the item is not an object and options do not allow continuing.
	 */
	#checkObjectType(item: unknown, index: number, option: ValidatorOption): ValidationViolation[] | null {
		if (typeof item === "object" && item !== null && !Array.isArray(item)) {
			return null;  // Valid
		}

		if (option.continueOnArrayTypeMismatch) {
			return [ { field: "(item)", rule: "non-object" } ];
		}

		throw new TypeError(`Invalid: element at index ${index} must be a non-null object in ArrayOfObjectsValidator.#checkObjectType`);
	}

	/**
	 * Checks for missing required keys in an item based on the schema rules.
	 *
	 * @param   {Record<string, unknown>}      item       - The item to check.
	 * @param   {number}                       index      - The index of the item in the original array.
	 * @param   {string[]}                     schemaKeys - The list of required keys from the schema.
	 * @param   {ValidatorOption}              option     - Validation options.
	 * @returns {ValidationViolation[] | null}              An array of missing key violations if any, otherwise null.
	 * @throws  {TypeError}                                 If required keys are missing and options do not allow continuing.
	 */
	#checkMissingKeys(item: Record<string, unknown>, index: number, schemaKeys: string[], option: ValidatorOption): ValidationViolation[] | null {
		const missingKeys = schemaKeys.filter(key => !(key in item));
		if (missingKeys.length === 0) {
			return null;  // Valid
		}

		if (option.continueOnMissingKeys) {
			return missingKeys.map(key => ({ field: key, rule: "missing" }));
		}

		throw new TypeError(`Invalid: object at index ${index} is missing required property(s) "${missingKeys.join(", ")}" in ArrayOfObjectsValidator.#checkMissingKeys`);
	}


	/**
	 * Validates a single item in the array.
	 *
	 * @param   {unknown}              item       - The item to validate.
	 * @param   {number}               index      - The index of the item.
	 * @param   {string[]}             schemaKeys - The required keys from the schema.
	 * @param   {object}               validation - The v8n validation object.
	 * @param   {ValidatorOption}      option     - Validation options.
	 * @returns {ValidationItemResult}              The result of validating the single item.
	 */
	// eslint-disable-next-line no-unused-vars
	#validateSingleItem(item: unknown, index: number, schemaKeys: string[], validation: { check: (value: unknown) => void }, option: ValidatorOption): ValidationItemResult {
		// Step 1: Validate that the item is a non-null object.
		const typeViolations = this.#checkObjectType(item, index, option);
		if (typeViolations) {
			return { isValid: false, item, index, violations: typeViolations };
		}

		// Step 2: Check for the presence of all required keys.
		// Since we've confirmed 'item' is a non-null object, we can cast it.
		const missingKeyViolations = this.#checkMissingKeys(item as Record<string, unknown>, index, schemaKeys, option);
		if (missingKeyViolations) {
			return { isValid: false, item, index, violations: missingKeyViolations };
		}

		// Step 3: Perform the main validation using the v8n schema.
		try {
			validation.check(item);
			return { isValid: true, item, index, violations: [] };
		} catch (error) {
			return { isValid: false, item, index, violations: this.#extractViolations(error) };
		}
	}

	/**
	 * Sets the final validation result and updates the internal state.
	 *
	 * @param   {boolean}                isAllValid   - Whether all items passed validation.
	 * @param   {ValidationItemResult[]} invalidItems - List of items that failed validation.
	 * @param   {unknown[]}              data         - The original data array.
	 * @param   {unknown}                schemaRules  - The original schema rules.
	 * @returns {ValidationFinalResult}                 The final validation result object.
	 */
	#setFinalResult(isAllValid: boolean, invalidItems: ValidationItemResult[], data: unknown[], schemaRules: unknown): ValidationFinalResult {
		const result: ValidationFinalResult = {
			isAllValid,
			invalidItems,
			source: {
				data,
				rules: {
					original   : schemaRules,
					stringified: ArrayOfObjectsValidator.stringifySchemaRules(schemaRules),
				}
			}
		};

		this.#lastResult = result;

		return result;
	}

	/**
	 * Validates the data array against the provided rules and stores the result internally.
	 *
	 * @param   {unknown[]}                data        - The array of objects to validate. Must be an array.
	 * @param   {unknown}                  schemaRules - The v8n schema object. Must be a valid v8n schema.
	 * @param   {Partial<ValidatorOption>} option      - Override options
	 * @returns {ValidationFinalResult}                  The validation result.
	 * @throws  {TypeError}                              If `data` is not an array.
	 * @throws  {Error}                                  If `schemaRules` is not a valid v8n schema.
	 */
	validate(data: unknown[], schemaRules: unknown, option: Partial<ValidatorOption> = {}): ValidationFinalResult {
		this.#lastResult = null;
		const finalOption: ValidatorOption = {
			allowEmptyArray            : option.allowEmptyArray             ?? this.#option.allowEmptyArray,
			continueOnArrayTypeMismatch: option.continueOnArrayTypeMismatch ?? this.#option.continueOnArrayTypeMismatch,
			continueOnMissingKeys      : option.continueOnMissingKeys       ?? this.#option.continueOnMissingKeys,
		};

		try {
			// 1. Pre-validation of arguments
			if (!Array.isArray(data)) {
				throw new TypeError("Invalid: the 'data' argument must be an array in ArrayOfObjectsValidator.validate");
			}
			this.#ensureDataValidOption(finalOption);
			// eslint-disable-next-line no-unused-vars
			const validation = this.#validateArguments(schemaRules) as { check: (value: unknown) => void };

			// 2. Early return for empty arrays
			if (data.length === 0) {
				console.info("INFO(validation): validation skipped: data array is empty");

				return this.#setFinalResult(finalOption.allowEmptyArray, [], data, schemaRules);
			}

			// 3. Main verification loop
			const schemaKeys        = Object.keys(schemaRules as Record<string, unknown>);
			const validationResults = data.map((item, index) => {
				return this.#validateSingleItem(item, index, schemaKeys, validation, finalOption);
			});

			// 4. Aggregation of results
			const invalidItems = validationResults.filter(result => !result.isValid);
			const isAllValid   = invalidItems.length === 0;

			return this.#setFinalResult(isAllValid, invalidItems, data, schemaRules);
		} catch (error) {
			this.#lastResult = null;

			throw new Error("Exception: an unexpected error occurred during the validation process in ArrayOfObjectsValidator.validate", { cause: error });
		}
	}

	/**
	 * Reports the last validation result to the console.
	 *
	 * @returns {void}
	 */
	reportToConsole(): void {
		if (!this.#lastResult) {
			console.error("ERROR(validation): Error: validation has not been run yet");
			return;
		}

		const { isAllValid, invalidItems, source } = this.#lastResult;
		let stringifiedRules: Record<string, string> = source?.rules?.stringified;

		if (stringifiedRules === undefined || stringifiedRules === null) {
			console.warn("WARN(validation): Invalid: 'source.rules.stringified' property is missing or null");
			stringifiedRules = {};  // Fallback to empty object to prevent errors
		}

		if (isAllValid) {
			console.info("INFO(validation): Success: all data is valid", { source });
		} else {
			const errorGroupTitle = `Error: Validation errors found for ${invalidItems.length} invalid items.`;
			console.groupCollapsed(errorGroupTitle);

			// display, validate rules
			{
				console.groupCollapsed("Applied Validation Rules (Stringified)");
				for (const key in stringifiedRules) {
					if (Object.hasOwn(stringifiedRules, key)) {
						console.debug("DEBUG(validation): validation rule detail", { key, rule: stringifiedRules[key] });
					}
				}
				console.groupEnd();
			}

			// display, error item
			{
				invalidItems.forEach(({ index, item, violations }) => {
					const groupTitle = `Array[ ${index} ]`;

					console.group(groupTitle);
					console.warn("WARN(validation): Invalid: item validation failed", { item });

					violations.forEach(({ field, rule }) => {
						console.warn("WARN(validation): Invalid: property violated rule", { field, rule });
					});

					console.groupEnd();
				});
			}

			console.groupEnd();
		}
	}
}