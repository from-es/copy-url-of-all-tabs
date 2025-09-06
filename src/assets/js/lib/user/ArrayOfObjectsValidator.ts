// Import NPM Package
import v8n from "v8n";



/**
 * Validator for objects in an array.
 * Validates each object in an array against a v8n schema.
 *
 * @author       From E
 * @lastModified 2025-07-29
 */
class ArrayOfObjectsValidator {
	#option = {
		allowEmptyArray            : true, // 空の配列を許可する
		continueOnArrayTypeMismatch: true, // デバック用、本番環境へのビルド時は false を指定推奨
		continueOnMissingKeys      : true, // デバック用、本番環境へのビルド時は false を指定推奨
	};
	#lastResult = null;

	constructor() {
		// nothing
	}

	/**
	 * Helper for #stringifySingleV8nRule to recursively stringify arguments.
	 * @private
	 * @param {*} arg The argument to stringify.
	 * @returns {string} The string representation of the argument.
	 */
	static #stringifySingleV8nRuleArg(arg) {
		if (typeof arg === "string") {
			return `'${arg}'`;
		} else if (arg instanceof RegExp) {
			return arg.toString();
		} else if (arg === null) {
			return "null";
		} else if (arg === undefined) {
			return "undefined";
		} else if (typeof arg === "object" && !Array.isArray(arg)) {
			// For plain objects, JSON.stringify is a reasonable fallback.
			return JSON.stringify(arg);
		} else if (Array.isArray(arg)) {
			// Recursively handle arrays within arguments
			return `[ ${arg.map(ArrayOfObjectsValidator.#stringifySingleV8nRuleArg).join(", ")} ]`;
		} else {
			return String(arg);
		}
	}

	/**
	 * Converts a v8n rule object into its string representation.
	 * @private
	 * @param {object} ruleObject The internal v8n rule object (e.g., rules.url).
	 * @returns {string} The string representation of the v8n rule chain.
	 */
	static #stringifySingleV8nRule(ruleObject) {
		if (!ruleObject || !Array.isArray(ruleObject.chain)) {
			return "Invalid v8n rule object structure";
		}

		let result = "v8n()";

		ruleObject.chain.forEach(
			(rule) => {
				let methodName = rule?.name;
				let args       = rule?.args;

				if (methodName === undefined) {
					console.warn("Warning: v8n rule object is missing 'name' property. Using 'unknownRule'. This might indicate a v8n internal structure change.");
					methodName = "unknownRule";
				}
				if (args === undefined) {
					console.warn("Warning: v8n rule object is missing 'args' property. Using empty array. This might indicate a v8n internal structure change.");
					args = [];
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
	 * @param {object} schemaRules The v8n schema rules object (e.g., { url: v8n()..., delay: v8n()... }).
	 * @returns {object} An object where keys are field names and values are stringified v8n rules.
	 */
	static stringifySchemaRules(schemaRules) {
		if (typeof schemaRules !== "object" || schemaRules === null || Array.isArray(schemaRules)) {
			throw new TypeError("The 'schemaRules' argument must be a non-null object.");
		}

		const stringified = {};

		for (const key in schemaRules) {
			if (Object.hasOwn(schemaRules, key)) {
				stringified[key] = ArrayOfObjectsValidator.#stringifySingleV8nRule(schemaRules[key]);
			}
		}

		return stringified;
	}

	/**
	 * Flattens nested v8n error information into a single array.
	 * @private
	 * @param {Error} error The error object thrown by v8n.
	 * @returns {{field: string, rule: string}[]} An array of violation information.
	 */
	#extractViolations(error) {
		const result = [];

		if (!error || !Array.isArray(error.violations)) {
			let fieldName = error?.property;
			let ruleName  = error?.rule?.name;

			if (fieldName === undefined) {
				fieldName = ruleName === "schema" ? "schema_validation_failed" : "unspecified_property";
			}
			if (fieldName || ruleName) {
				result.push({ field: fieldName, rule: ruleName });
			}

			return result;
		}

		error.violations.forEach(violation => {
			if (violation.rule?.name === "schema" && violation.param && typeof violation.param === "object") {
				for (const key in violation.param) {
					const nestedError = violation.param[key];
					const nestedViolations = this.#extractViolations(nestedError);

					nestedViolations.forEach(nestedViolation => {
						const fieldName = nestedViolation.field === "unspecified_property" ? "" : `.${nestedViolation.field}`;
						result.push({ field: `${key}${fieldName}`, rule: nestedViolation.rule });
					});
				}
			} else {
				result.push({ field: violation.property ?? "unspecified_property", rule: violation.rule?.name });
			}
		});

		return result;
	}

	#ensureDataValidOption(option) {
		if (!(option && typeof option === "object")) {
			throw new TypeError("The 'option' argument must be an object.");
		}

		// Set default value
		if (!Object.hasOwn(option, "allowEmptyArray")) {
			option.allowEmptyArray = true;
		}
		if (!Object.hasOwn(option, "continueOnArrayTypeMismatch")) {
			option.continueOnArrayTypeMismatch = true;
		}
		if (!Object.hasOwn(option, "continueOnMissingKeys")) {
			option.continueOnMissingKeys = true;
		}
	}

	/**
	 * Validates the data and schemaRules arguments.
	 *
	 * @private
	 * @param {object} schemaRules The v8n schema object.
	 * @returns {object} The v8n validation object.
	 * @throws {Error} If `schemaRules` is not a valid v8n schema.
	 */
	#validateArguments(schemaRules) {
		// Validate 'schemaRules' argument
		try {
			return v8n().schema(schemaRules);
		} catch (error) {
			throw new Error(`The 'schemaRules' argument is not a valid v8n schema for v8n library: ${error.message}`, { cause: error });
		}
	}

	#checkObjectType(item, index, option) {
		if (typeof item === "object" && item !== null && !Array.isArray(item)) {
			return null; // Valid
		}

		if (option.continueOnArrayTypeMismatch) {
			return [ { field: "(item)", rule: "non-object" } ];
		}

		throw new TypeError(`Element at index ${index} must be a non-null object.`);
	}

	#checkMissingKeys(item, index, schemaKeys, option) {
		const missingKeys = schemaKeys.filter(key => !(key in item));
		if (missingKeys.length === 0) {
			return null; // Valid
		}

		if (option.continueOnMissingKeys) {
			return missingKeys.map(key => ({ field: key, rule: "missing" }));
		}

		throw new TypeError(`Object at index ${index} is missing required property(s): '${missingKeys.join(" ', '")}'.`);
	}

	#validateSingleItem(item, index, schemaKeys, validation, option) {
		// Step 1: Validate that the item is a non-null object.
		const typeViolations = this.#checkObjectType(item, index, option);
		if (typeViolations) {
			return { isValid: false, item, index, violations: typeViolations };
		}

		// Step 2: Check for the presence of all required keys.
		const missingKeyViolations = this.#checkMissingKeys(item, index, schemaKeys, option);
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

	#setFinalResult(isAllValid, invalidItems, data, schemaRules) {
		const result = {
			isAllValid,
			invalidItems,
			source: {
				data: data,
				rules: {
					original: schemaRules,
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
	 * @param {Array<object>} data The array of objects to validate. Must be an array.
	 * @param {object} schemaRules The v8n schema object. Must be a valid v8n schema.
	 * @param {object} option Override options
	 * @returns {{isAllValid: boolean, invalidItems: Array<object>, source: {data: Array<object>, rules: object}}} The validation result.
	 * @throws {TypeError} If `data` is not an array.
	 * @throws {Error} If `schemaRules` is not a valid v8n schema.
	 */
	validate(data, schemaRules, option = {}) {
		this.#lastResult  = null;
		const finalOption = { ...this.#option, ...option };

		try {
			// 1. 引数の事前検証
			if (!Array.isArray(data)) {
				throw new TypeError("The 'data' argument must be an array.");
			}
			this.#ensureDataValidOption(finalOption);
			const validation = this.#validateArguments(schemaRules);

			// 2. 空配列の早期リターン
			if (data.length === 0) {
				console.info("Validation skipped: The provided data array is empty. No violations found.");

				return this.#setFinalResult(finalOption.allowEmptyArray, [], data, schemaRules);
			}

			// 3. メインの検証ループ
			const schemaKeys        = Object.keys(schemaRules);
			const validationResults = data.map((item, index) => {
				return this.#validateSingleItem(item, index, schemaKeys, validation, finalOption);
			});

			// 4. 結果の集計
			const invalidItems = validationResults.filter(result => !result.isValid);
			const isAllValid   = invalidItems.length === 0;

			return this.#setFinalResult(isAllValid, invalidItems, data, schemaRules);
		} catch (error) {
			this.#lastResult = null;

			throw new Error(`An unexpected error occurred during the validation process: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Reports the last validation result to the console.
	 */
	reportToConsole() {
		if (!this.#lastResult) {
			console.error("Validation has not been run yet. Please call validate() first.");
			return;
		}

		const { isAllValid, invalidItems, source } = this.#lastResult;
		let stringifiedRules = source?.rules?.stringified;

		if (stringifiedRules === undefined || stringifiedRules === null) {
			console.warn("Warning: 'source.rules.stringified' property is missing or null. This might indicate a change in the validation result structure.");
			stringifiedRules = {}; // Fallback to empty object to prevent errors
		}

		if (isAllValid) {
			console.log("Success: All data is valid.", source);
		} else {
			const errorGroupTitle = `Error: Validation errors found for ${invalidItems.length} invalid items.`;
			console.groupCollapsed(errorGroupTitle);

			// display, validate rules
			{
				console.groupCollapsed("Applied Validation Rules (Stringified)");
				for (const key in stringifiedRules) {
					if (Object.hasOwn(stringifiedRules, key)) {
						console.log(`${key}: ${stringifiedRules[key]}`);
					}
				}
				console.groupEnd("Applied Validation Rules (Stringified)");
			}

			// display, error item
			{
				invalidItems.forEach(({ index, item, violations }) => {
					const groupTitle = `Array[${index}]`;
					console.group(groupTitle);
					console.log("Invalid Item:", item);

					violations.forEach(({ field, rule }) => {
						console.log(`Property "${field}" violated rule "${rule}".`);
					});

					console.groupEnd(groupTitle);
				});
			}

			console.groupEnd(errorGroupTitle);
		}
	}
}



export { ArrayOfObjectsValidator };