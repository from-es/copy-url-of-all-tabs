/**
 * Utility for loading, validating, and sorting sequence rules.
 * Handles both direct rule arrays and module maps from `import.meta.glob`.
 *
 * @file
 * @lastModified 2026-06-20
 */

import type { SequenceRule } from "./types";

/**
 * Type for the exports that modules imported by `import.meta.glob` should have.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type RuleModule<T, C> = {
	rules: SequenceRule<T, C>[];
};

/**
 * Type for the modules obtained as a result of `import.meta.glob`.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type ImportModules<T, C> = Record<string, RuleModule<T, C>>;

/**
 * Extracts rules from various input formats and flattens them into a single array.
 *
 * @template T                                                   - The type of the data object.
 * @template C                                                   - The type of the context object.
 * @param   {ImportModules<T, C> | SequenceRule<T, C>[]} modules - Input rules or module map.
 * @returns {SequenceRule<T, C>[]}                                 Flattened array of rules.
 * @throws  {Error}                                                If a module lacks a valid "rules" export.
 */
function extractRulesFromModules<T, C>(modules: ImportModules<T, C> | SequenceRule<T, C>[]): SequenceRule<T, C>[] {
	if (Array.isArray(modules)) {
		return modules;
	}

	const allRules: SequenceRule<T, C>[] = [];

	for (const path in modules) {
		const module = modules[path];

		try {
			if (!module || !Array.isArray(module.rules)) {
				throw new Error(`Error: module at "${path}" does not have a valid "rules" export in extractRulesFromModules`);
			}
			allRules.push(...module.rules);
		} catch (error) {
			throw new Error(`Failure: failed to load rules from "${path}" in extractRulesFromModules`, { cause: error });
		}
	}

	return allRules;
}

/**
 * Type for a validation error report for a single rule.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type RuleValidationError<T, C> = {
	rule  : SequenceRule<T, C>;
	errors: string[];
};

/**
 * Type for the result of partitioning rules into valid and invalid sets.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type PartitionedRules<T, C> = {
	validRules: SequenceRule<T, C>[];
};

/**
 * Validates the structure and property types of each rule.
 * Throws a detailed error if any invalid rule is detected (Fail-Fast).
 *
 * @template T                           - The type of the data object.
 * @template C                           - The type of the context object.
 * @param   {SequenceRule<T, C>[]} rules - The rules to validate.
 * @returns {PartitionedRules<T, C>}       Object containing valid rules.
 * @throws  {Error}                        If invalid rules are found.
 */
function partitionRules<T, C>(rules: SequenceRule<T, C>[]): PartitionedRules<T, C> {
	const validRules: SequenceRule<T,              C>[] = [];
	const errorDetailsList: RuleValidationError<T, C>[] = [];

	rules.forEach((rule) => {
		const errors: string[] = [];

		if (!rule || typeof rule !== "object") {
			errors.push("Rule is not an object.");
		} else {
			if (!rule.meta || typeof rule.meta !== "object") {
				errors.push("Missing or invalid 'meta' object.");
			} else {
				if (!rule.meta.name || typeof rule.meta.name !== "string") {
					errors.push("Missing or invalid 'meta.name' (must be string).");
				}
				if (!rule.meta.description || typeof rule.meta.description !== "object") {
					errors.push("Missing or invalid 'meta.description' object.");
				} else if (!rule.meta.description.reason || typeof rule.meta.description.reason !== "string") {
					errors.push("Missing or invalid 'meta.description.reason' (must be string).");
				}
			}

			if (rule.spec !== undefined) {
				if (typeof rule.spec !== "object" || rule.spec === null) {
					errors.push("'spec' must be an object.");
				} else {
					if (rule.spec.platforms !== undefined && !Array.isArray(rule.spec.platforms)) {
						errors.push("'spec.platforms' must be an array of strings.");
					}
					if (rule.spec.lifecycle !== undefined) {
						if (typeof rule.spec.lifecycle !== "object" || rule.spec.lifecycle === null) {
							errors.push("'spec.lifecycle' must be an object.");
						} else {
							if (rule.spec.lifecycle.introduced !== undefined && typeof rule.spec.lifecycle.introduced !== "string") {
								errors.push("'spec.lifecycle.introduced' must be a string.");
							}
							if (rule.spec.lifecycle.obsoleted !== undefined && typeof rule.spec.lifecycle.obsoleted !== "string") {
								errors.push("'spec.lifecycle.obsoleted' must be a string.");
							}
						}
					}
				}
			}

			if (rule.order !== undefined && (typeof rule.order !== "number" || isNaN(rule.order) || rule.order < 0)) {
				errors.push("Invalid 'order' property (must be a non-negative number).");
			}

			if (!rule.process || typeof rule.process !== "object") {
				errors.push("Missing or invalid 'process' object.");
			} else {
				if (typeof rule.process.condition !== "function") {
					errors.push("Missing or invalid 'process.condition' (must be a function).");
				}
				if (typeof rule.process.execute !== "function") {
					errors.push("Missing or invalid 'process.execute' (must be a function).");
				}
			}
		}

		if (errors.length > 0) {
			errorDetailsList.push({ rule, errors });
		} else {
			validRules.push(rule);
		}
	});

	if (errorDetailsList.length > 0) {
		const details = JSON.stringify(errorDetailsList, null, "\t");

		throw new Error(`Invalid rules detected in loadRules. Details:\n${details}`);
	}

	return { validRules };
}

/**
 * Checks for duplicate "order" values among rules.
 *
 * @template T                           - The type of the data object.
 * @template C                           - The type of the context object.
 * @param   {SequenceRule<T, C>[]} rules - The rules to check.
 * @throws  {Error}                        If duplicate order values are found.
 */
function checkForDuplicateOrders<T, C>(rules: SequenceRule<T, C>[]): void {
	const orders = new Map<number, string[]>();

	rules.forEach((rule, index) => {
		if (rule.order === undefined) {
			return;
		}
		const ruleIdentifier = rule.meta?.name || `Unnamed rule at index ${index}`;
		let   entry          = orders.get(rule.order);

		if (!entry) {
			entry = [];
			orders.set(rule.order, entry);
		}

		entry.push(ruleIdentifier);
	});

	orders.forEach((ruleIdentifiers, order) => {
		if (ruleIdentifiers.length > 1) {
			throw new Error(`Duplicate order value "${order}" found in rules: [${ruleIdentifiers.join(", ")}].`);
		}
	});
}

/**
 * Sorts rules in ascending order based on the "order" property.
 * Rules without an order are placed at the end while maintaining their relative input order.
 *
 * @template T                           - The type of the data object.
 * @template C                           - The type of the context object.
 * @param   {SequenceRule<T, C>[]} rules - The rules to sort.
 * @returns {SequenceRule<T, C>[]}         Sorted array of rules.
 */
function sortAndCombineRules<T, C>(rules: SequenceRule<T, C>[]): SequenceRule<T, C>[] {
	// Stable sort for rules without order
	return rules.map((rule, index) => ({ rule, index })).sort((a, b) => {
		const orderA = a.rule.order ?? Infinity;
		const orderB = b.rule.order ?? Infinity;

		if (orderA !== orderB) {
			return orderA - orderB;
		}

		return a.index - b.index;
	}).map(item => item.rule);
}

/**
 * Main entry point for loading rules. Orchestrates extraction, validation, and sorting.
 *
 * @template T                                                   - The type of the data object.
 * @template C                                                   - The type of the context object.
 * @param   {ImportModules<T, C> | SequenceRule<T, C>[]} modules - Input rules or module map.
 * @returns {SequenceRule<T, C>[]}                                 Sorted and validated rules.
 * @throws  {Error}                                                If validation fails or duplicates are found.
 */
function loadRules<T, C>(modules: ImportModules<T, C> | SequenceRule<T, C>[]): SequenceRule<T, C>[] {
	const allRulesRaw    = extractRulesFromModules<T, C>(modules);
	const { validRules } = partitionRules<T, C>(allRulesRaw);

	checkForDuplicateOrders<T, C>(validRules);
	const sortedRules = sortAndCombineRules<T, C>(validRules);

	return sortedRules;
}



export {
	loadRules,
	type RuleModule,
	type ImportModules
};