/**
 * Rule loader utility that provides functionality to dynamically import, process, and sort rule files matching a specified glob pattern.
 *
 * @file
 * @author       From E
 * @lastModified 2026-03-23
 */

// Import NPM Package
import { get as lodashGetValue, set as lodashSetValue } from "lodash-es";

// Import Types
import type { MigrationRule } from "./types";



// =================================================================================
// Local Type Definitions
// =================================================================================

/**
 * Type for the exports that modules imported by `import.meta.glob` should have.
 * Each rule file must export an array of `MigrationRule<T>[]` under the name `rules`.
 *
 * @template T - The type of the data object being migrated.
 */
type RuleModule<T> = {
	rules: MigrationRule<T>[];
};

/**
 * Type for the modules obtained as a result of `import.meta.glob`.
 * Since `eager: true` is used, these are treated as synchronous modules here.
 *
 * @template T - The type of the data object being migrated.
 */
type ImportModules<T> = Record<string, RuleModule<T>>;

/**
 * Type definition for the result of partitioning rules into valid and invalid sets.
 *
 * @template T - The type of the data object being migrated.
 */
type PartitionedRules<T> = {
	validRules  : MigrationRule<T>[];
	invalidRules: MigrationRule<T>[];
};



// =================================================================================
// Helper Functions
// =================================================================================

/**
 * Extracts all rules from a module map and flattens them into a single array.
 *
 * @template T                          - The type of the data object being migrated.
 * @param    {ImportModules<T>} modules - The result of `import.meta.glob` (eager: true).
 * @returns  {MigrationRule<T>[]}         An array of extracted rules.
 */
function extractRulesFromModules<T>(modules: ImportModules<T>): MigrationRule<T>[] {
	const allRules: MigrationRule<T>[] = [];

	for (const path in modules) {
		const module = modules[path];

		try {
			if (!module || !Array.isArray(module.rules)) {
				// Throw an error if the module does not export rules correctly.
				throw new Error(`Error: module at "${path}" does not have a valid "rules" export in extractRulesFromModules`);
			}

			allRules.push(...module.rules);
		} catch (error) {
			// Throw an error immediately if one occurs while loading rules.
			throw new Error(`Failure: failed to load rules from "${path}" in extractRulesFromModules`, { cause: error });
		}
	}

	return allRules;
}

/**
 * Validates an array of migration rules and partitions them into valid and invalid sets.
 * Inspects the validity of required properties (`condition`, `execute`) and recommended properties (`meta`, `order`) for each rule.
 * Throws an error immediately (Fail-Fast) if any invalid rule is found or if the `order` property is duplicated.
 * This ensures that rules passed to subsequent processes are always guaranteed to be valid.
 *
 * @template T                          - The type of the data object being migrated.
 * @param    {MigrationRule<T>[]} rules - The array of rules to be validated and partitioned.
 * @returns  {PartitionedRules<T>}        An object containing an array of valid rules (`validRules`) and an array of invalid rules (`invalidRules`), which is typically empty due to Fail-Fast.
 */
function partitionRules<T>(rules: MigrationRule<T>[]): PartitionedRules<T> {
	const validRules      : MigrationRule<T>[] = [];
	const invalidRules    : MigrationRule<T>[] = [];
	const errorDetailsList: object[]           = [];  // Detailed list of errors detected during validation of each rule.

	rules.forEach((rule) => {
		// Validate the rule using `validateRule` and get the result (report).
		const { report } = validateRule(rule);

		// Log any `warningReport` items to the console (following existing behavior).
		if (report.warningReport.length > 0) {
			report.warningReport.forEach(warning => {
				// Log warnings regarding missing `meta` and `order` properties as `console.warn`.
				if (warning.reason.includes("this property is optional")) {
					console.warn("WARN(migration): optional property missing in migration rule", { reason: warning.reason, rule });
				}
			});
		}

		// Check if `errorReport` contains any errors.
		if (report.errorReport.length > 0) {
			// Process as an invalid rule if errors exist.
			invalidRules.push(rule);
			// Add error details to `errorDetailsList`.
			errorDetailsList.push({
				rule,                       // Store the entire rule object where the error occurred.
				errors: report.errorReport  // Detailed error report from `validateRule`.
			});
		} else {
			// Add as a valid rule if no errors exist.
			validRules.push(rule);
		}
	});

	console.debug("DEBUG(migration): validate migration rules", { validRules, invalidRules });

	// Check for errors and handle Fail-Fast.
	if (errorDetailsList.length > 0) {
		const details = JSON.stringify(errorDetailsList, null, "\t");
		throw new Error(`Invalid: invalid rules detected in partitionRules. Details:\n${details}`);
	}

	// Due to the Fail-Fast strategy, invalidRules will always be an empty array at this point.
	return { validRules, invalidRules };
}

/**
 * Validates the structure and type of a single migration rule object.
 * This function is intended to be called internally from `partitionRules`.
 *
 * @template T                                                                                        - The type of the data object being migrated.
 * @param    {MigrationRule<T>} rule                                                                  - The single migration rule to be validated.
 * @returns  {{ rule: MigrationRule<T>, report: { warningReport: Report[], errorReport: Report[] } }}   An object containing the validation report.
 */
function validateRule<T>(rule: MigrationRule<T>): { rule: MigrationRule<T>; report: { warningReport: Report[]; errorReport: Report[]; }; } {
	/**
	 * Defines the multi-valued logic states returned by the validation logic.
	 * Each value indicates a specific state of the validation result and is used for flow control in subsequent processes.
	 *
	 * true                        : The target property exists and has a valid type.
	 * false                       : The target property exists but has an invalid type.
	 * undefined                   : The target property does not exist.
	 * "Optional Property"         : The target property does not need to exist (warn if it doesn't).
	 * "Pass Through"              : Treated the same as `true`. Used to skip validation under certain conditions and let the result pass.
	 * "Skip to Next Validate Rule": Interrupts subsequent validation for the current rule object and moves to validation of the next rule object.
	 */
	type ValidationStatus = boolean | "Optional Property" | undefined | "Pass Through" | "Skip to Next Validate Rule";
	type ValidationList = {
		/**
		 * Path string to the property being validated. Format passed to `lodash.get`.
		 */
		target: string;

		/**
		 * Function implementing the validation logic.
		 * Evaluates if the passed object is in the expected state and returns a `ValidationStatus` value.
		 * The returned value determines the success or failure of validation and whether to continue processing.
		 */
		// eslint-disable-next-line no-unused-vars
		validate: (_obj: unknown) => ValidationStatus;

		/**
		 * Function that generates a human-readable message based on the validation flag, property path, and property information.
		 * Primarily used to communicate details about errors and warnings.
		 */
		// eslint-disable-next-line no-unused-vars
		message: (_flag: ValidationStatus, _target: string, _property: unknown) => string;

		/**
		 * (Optional) Information for performing custom exception handling or special actions based on specific validation results.
		 * Currently unused, but remains for future extension.
		 */
		except?: unknown;
	};
	type ValidationReport = {
		target  : string;
		property: unknown;
		reason  : string;
	};

	/**
	 * Generates a human-readable message string based on the validation status flag.
	 *
	 * @param   {ValidationStatus} flag     - Validation status flag.
	 * @param   {string}           target   - Property name or target being validated.
	 * @param   {unknown}          property - Property value.
	 * @returns {string}                      Message string.
	 * @throws                                Although it may occur at the implementation level, no error is thrown during rule validation.
	 */
	const createMessage = (flag: ValidationStatus, target: string, property: unknown): string => {
		switch (flag) {
			case VALIDATION_STATUS.OptionalProperty:
				return `Property '${target}' does not exist in rule. But, this property is optional.`;
			case VALIDATION_STATUS.NonExistentProperty:
				return `Property '${target}' does not exist in rule.`;
			case VALIDATION_STATUS.ValidProperty:
				return `Property '${target}' is valid.`;
			case VALIDATION_STATUS.InValidProperty:
				return `Property '${target}' exist in rule. But, the property type is invalid. typeof: ${typeof property}, property: ${String(property)}.`;
			case VALIDATION_STATUS.SkipToNextValidateRule:
				return `rule object is invalid. typeof: ${typeof property}.`;
			default: {
				throw new Error(`Error: unknown ValidationStatus "${flag}" for property "${target}" in validateRule.createMessage`);
			}
		}
	};

	const VALIDATION_STATUS = {
		ValidProperty         : true,
		InValidProperty       : false,
		OptionalProperty      : "Optional Property",
		NonExistentProperty   : undefined,
		PassThrough           : "Pass Through",
		SkipToNextValidateRule: "Skip to Next Validate Rule"
	};
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const validationContext: Record<string, any> = {};  // For recording validation context.
	const warningReport    : ValidationReport[]  = [];
	const errorReport      : ValidationReport[]  = [];
	const validationList   : ValidationList[]    = [
		// meta: Validate 'meta' property (Recommended)
		// 'meta' is information for developers and is not mandatory.
		// Validate the structure only if it exists; treat as error if invalid, but continue if non-existent (warn only).
		{
			target  : "meta",
			validate: (obj) => {
				if (obj === undefined) {
					lodashSetValue(validationContext, "meta.exist", false);
					return VALIDATION_STATUS.OptionalProperty as ValidationStatus;
				}

				lodashSetValue(validationContext, "meta.exist", true);
				return (!!obj && obj !== null && typeof obj === "object" && Object.keys(obj).length > 0) as ValidationStatus;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.author",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string") as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.reason",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string") as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.target",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string") as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.action",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string") as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.authored",
			validate: (obj) => {
				if (!validationContext?.meta?.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string" && /^(2[0-9]{3})-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/.test(obj)) as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.version",
			validate: (obj) => {
				if (obj === undefined) {
					lodashSetValue(validationContext, "meta.version.exist", false);
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				}

				lodashSetValue(validationContext, "meta.version.exist", true);
				return (!!obj && obj !== null && typeof obj === "object" && Object.hasOwn(obj, "introduced") && Object.hasOwn(obj, "obsoleted")) as ValidationStatus;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.version.introduced",
			validate: (obj) => {
				if (!validationContext.meta.version.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return (!!obj && obj !== null && typeof obj === "string") as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},
		{
			target  : "meta.version.obsoleted",
			validate: (obj) => {
				if (!validationContext.meta.version.exist) {
					return VALIDATION_STATUS.PassThrough as ValidationStatus;
				}

				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				} else {
					return ((obj === null || typeof obj === "string") ? true : false) as ValidationStatus;
				}
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// order: Validate 'order' property (Optional)
		// 'order' controls the sequence of rule application and is not mandatory.
		// Validate the type only if it exists; treat as error if invalid.
		// Continue with a warning only if non-existent.
		{
			target  : "order",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.OptionalProperty as ValidationStatus;
				}

				return (typeof obj === "number" && !isNaN(obj) && obj >= 0) as ValidationStatus;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// condition: Validate 'condition' property (Required)
		// 'condition' is mandatory as it defines the conditions for applying the rule.
		{
			target  : "condition",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				}

				return (typeof obj === "function") as ValidationStatus;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		},

		// validate: Validate 'execute' property (Required)
		// 'execute' is mandatory as it defines the process when a rule is applied.
		{
			target  : "execute",
			validate: (obj) => {
				if (obj === undefined) {
					return VALIDATION_STATUS.NonExistentProperty as ValidationStatus;
				}

				return (typeof obj === "function") as ValidationStatus;
			},
			message: (flag, target, property) => {
				return createMessage(flag, target, property);
			}
		}
	];

	for (const validation of validationList) {
		// rule: Validate validity of the rule object itself.
		if (!rule || typeof rule !== "object" || Object.keys(rule).length === 0) {
			// Add to error report and interrupt subsequent validation (Early Return).
			errorReport.push({
				target  : "rule",
				property: rule,
				reason  : "Rule object is invalid (null, undefined, not an object, or empty)."
			});

			return {
				rule,
				report: {
					warningReport: [],
					errorReport  : errorReport
				}
			};
		}

		/*
			rule.*: Validate properties under the rule object.
		*/
		const propertyValue = lodashGetValue(rule, validation.target);
		const validate      = validation.validate(propertyValue);
		const message       = validation.message(validate, validation.target, propertyValue);
		const report        = {
			target  : validation.target,
			property: propertyValue,
			reason  : message
		};

		switch (validate) {
			case VALIDATION_STATUS.SkipToNextValidateRule:
				// When executing something, use the `except` property.
				break;
			case VALIDATION_STATUS.OptionalProperty:
				(warningReport).push(report);
				break;
			case VALIDATION_STATUS.NonExistentProperty:
				(errorReport).push(report);
				break;
			case VALIDATION_STATUS.ValidProperty:
				// do nothing
				break;
			case VALIDATION_STATUS.InValidProperty:
				(errorReport).push(report);
				break;
			case VALIDATION_STATUS.PassThrough:
				// do nothing
				break;
			default:
				break;
		}
	}

	const result = {
		rule,
		report: {
			warningReport,
			errorReport
		}
	};

	return result;
}

/**
 * Validates the uniqueness of the `order` property within a valid set of rules and throws an error if duplicates are found (Fail-Fast).
 *
 * @template T                          - The type of the data object being migrated.
 * @param    {MigrationRule<T>[]} rules - The array of rules to check for uniqueness.
 */
function checkForDuplicateOrders<T>(rules: MigrationRule<T>[]): void {
	const orders = new Map<number, { count: number, ruleIdentifiers: string[] }>();
	rules.forEach((rule, index) => {
		// Rules without an order property are not checked.
		if (rule.order === undefined) {
			return;
		}

		const ruleIdentifier = rule.meta?.reason || `Unnamed rule at index ${index} (order: ${rule.order})`;
		let entry = orders.get(rule.order);

		if (!entry) {
			entry = { count: 0, ruleIdentifiers: [] };
			orders.set(rule.order, entry);
		}

		entry.count++;
		entry.ruleIdentifiers.push(ruleIdentifier);
	});

	orders.forEach((entry, order) => {
		if (entry.count > 1) {
			// Fail-Fast: throw error for duplicate orders.
			throw new Error(
				`Error: duplicate order value "${order}" found in ${entry.count} rules in checkForDuplicateOrders. This can lead to unpredictable execution order. Involved rules: [${entry.ruleIdentifiers.join(", ")}]. Please ensure all rule "order" properties are unique.`
			);
		}
	});
}

/**
 * Sorts valid rules and combines them with invalid rules.
 * (In the case of Fail-Fast, invalidRules will always be an empty array).
 *
 * @template T                                 - The type of the data object being migrated.
 * @param    {MigrationRule<T>[]} validRules   - The array of valid rules to be sorted.
 * @param    {MigrationRule<T>[]} invalidRules - The array of invalid rules to be combined.
 * @returns  {MigrationRule<T>[]}                The final array of rules.
 */
function sortAndCombineRules<T>(validRules: MigrationRule<T>[], invalidRules: MigrationRule<T>[]): MigrationRule<T>[] {
	// Sort valid rules in ascending order based on the `order` property.
	// Rules without an `order` property are placed after those with one.
	validRules.sort((a, b) => {
		if (a.order !== undefined && b.order !== undefined) {
			return a.order - b.order;
		}
		if (a.order !== undefined) {
			return -1;  // a first
		}
		if (b.order !== undefined) {
			return 1;  // b first
		}
		return 0;  // No change in order
	});

	// Although invalidRules will always be empty due to Fail-Fast, keep combining for the function signature.
	return [ ...validRules, ...invalidRules ];
}

// =================================================================================
// Rule Loader: loadRules
// =================================================================================

/**
 * Dynamically loads migration rules from a specified module map, sorts them, and returns the result.
 * Throws an error if invalid rules or duplicate order values are found (Fail-Fast).
 *
 * Note: This function is intended to be used in conjunction with `import.meta.glob`.
 * Use with the `eager: true` option to avoid asynchronous loading issues in environments such as Service Workers.
 *
 * @template T                            - The type of the data object being migrated.
 * @param    {ImportModules<T>}   modules - Result of `import.meta.glob` (synchronous module map due to `eager: true`).
 * @returns  {MigrationRule<T>[]}           An array of migration rules sorted in ascending order by the `order` property.
 *
 * @example
 * // rules/index.ts
 * import { loadRules } from '@/assets/js/lib/user/MigrationManager/loadRules';
 *
 * const modules = import.meta.glob('./v1/*.rule.ts', { eager: true });
 * const migrationRules = loadRules(modules);
 */
function loadRules<T>(modules: ImportModules<T>): MigrationRule<T>[] {
	const allRulesRaw = extractRulesFromModules(modules);
	const { validRules, invalidRules } = partitionRules<T>(allRulesRaw);

	checkForDuplicateOrders(validRules);

	const allRules = sortAndCombineRules(validRules, invalidRules);

	console.debug("DEBUG(migration): successfully loaded and sorted migration rules", { count: allRules.length });

	return allRules;
}



export {
	loadRules
};
export type {
	RuleModule,
	ImportModules
};