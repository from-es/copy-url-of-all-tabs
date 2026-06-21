/**
 * Core module for executing a sequence of rules on a data object.
 * Provides a structured way to apply transformations, handle errors, and manage context-aware rule execution.
 *
 * @file
 * @lastModified 2026-06-20
 *
 * @dependency compareVersions
 */

// Import Module
import { compareVersions } from "@/assets/js/utils/CompareVersions";
import { loadRules }       from "./loadRules";

// Import Types
import type { ImportModules } from "./loadRules";
import type {
	SequenceRule,
	SequenceResult,
	SequenceOptions,
	SequenceStatus,
	SequenceError,
	SequenceContextBase,
	SequenceArgument
} from "./types";

/**
 * Class that manages and executes a sequence of rules.
 * Supports platform-based and version-based filtering of rules.
 *
 * @template T - The type of the data object being processed.
 * @template C - The type of the context object used by the rules.
 */
export class SequenceProcessor<T, C> {
	/**
	 * Array of rules to be executed.
	 */
	private rules: SequenceRule<T, C>[];

	/**
	 * Initializes a new instance of the SequenceProcessor.
	 *
	 * @param {SequenceRule<T, C>[] | ImportModules<T, C>} rules - An array of sequence rules or a module map.
	 */
	constructor(rules: SequenceRule<T, C>[] | ImportModules<T, C>) {
		this.rules = loadRules(rules);
	}

	/**
	 * Resolves the clone function from options.
	 * Defaults to the native `structuredClone` method.
	 *
	 * @param   {SequenceOptions<T>} options - Execution options.
	 * @returns {(data: T) => T}               The resolved cloning function.
	 */
	private getCloneFn(options: SequenceOptions<T>): (data: T) => T {
		return options.cloneFn ?? structuredClone;
	}

	/**
	 * Executes the sequence of rules on the provided data.
	 *
	 * @param   {T}                             data    - The data to be processed.
	 * @param   {C}                             context - The context object to be passed to rules.
	 * @param   {SequenceOptions<T>}            options - Configuration options for the execution.
	 * @returns {Promise<SequenceResult<T, C>>}           The result of the processing sequence.
	 */
	public async process(
		data   : T,
		context: C,
		options: SequenceOptions<T> = {}
	): Promise<SequenceResult<T, C>> {
		const finalOptions: SequenceOptions<T> = {
			failFast             : false,
			captureErrorSnapshots: true,
			immutableInput       : true,
			...options
		};
		const clone = this.getCloneFn(finalOptions);

		// 1. Backup the "original" input data for a full rollback in case of failure.
		// If immutableInput is false, keep the input data as a direct reference (memory saving).
		const originalData = finalOptions.immutableInput !== false ? clone(data) : data;
		const result       = await this.runRules(originalData, context, finalOptions);

		return result;
	}

	/**
	 * Orchestrates the execution of all rules.
	 *
	 * @param   {T}                             originalData - The initial state of the data.
	 * @param   {C}                             context      - The context object.
	 * @param   {SequenceOptions<T>}            options      - Execution options.
	 * @returns {Promise<SequenceResult<T, C>>}                The processing result.
	 */
	private async runRules(
		originalData: T,
		context     : C,
		options     : SequenceOptions<T>
	): Promise<SequenceResult<T, C>> {
		const clone = this.getCloneFn(options);
		const state: SequenceResult<T, C> = {
			// 2. Keep originalData immutable and create a "working copy" for actual processing.
			data        : clone(originalData),
			status      : "success",
			isApplied   : false,
			appliedRules: [],
			errors      : []
		};

		for (const rule of this.rules) {
			const shouldAbort = await this.executeRuleStep(rule, state, context, options, originalData);

			if (shouldAbort) {
				break;
			}
		}

		return state;
	}

	/**
	 * Executes a single rule step.
	 *
	 * @param   {SequenceRule<T, C>}   rule         - The rule to execute.
	 * @param   {SequenceResult<T, C>} state        - The current execution state.
	 * @param   {C}                    context      - The context object.
	 * @param   {SequenceOptions<T>}   options      - Execution options.
	 * @param   {T}                    originalData - The initial data for rollback.
	 * @returns {Promise<boolean>}                    True if the sequence should be aborted.
	 */
	private async executeRuleStep(
		rule        : SequenceRule<T,   C>,
		state       : SequenceResult<T, C>,
		context     : C,
		options     : SequenceOptions<T>,
		originalData: T
	): Promise<boolean> {
		if (!this.shouldExecute(rule, context)) {
			return false;  // Skip due to environmental mismatch
		}

		const clone          = this.getCloneFn(options);
		const dataBeforeRule = clone(state.data);

		const arg: SequenceArgument<T, C> = {
			data: state.data,
			context,
			defaultValues: context
		};

		return this.applyRule(rule, state, arg, dataBeforeRule, options, originalData);
	}

	/**
	 * Invokes the rule's process logic and handles the outcome.
	 *
	 * @param   {SequenceRule<T, C>}     rule           - The rule to apply.
	 * @param   {SequenceResult<T, C>}   state          - The current execution state.
	 * @param   {SequenceArgument<T, C>} arg            - The argument for the rule's process functions.
	 * @param   {T}                      dataBeforeRule - The data state before applying the rule.
	 * @param   {SequenceOptions<T>}     options        - Execution options.
	 * @param   {T}                      originalData   - The initial data for rollback.
	 * @returns {Promise<boolean>}                        True if the sequence should be aborted.
	 */
	private async applyRule(
		rule          : SequenceRule<T, C>,
		state         : SequenceResult<T, C>,
		arg           : SequenceArgument<T, C>,
		dataBeforeRule: T,
		options       : SequenceOptions<T>,
		originalData  : T
	): Promise<boolean> {
		try {
			if (typeof rule.process.condition === "function" && !(await rule.process.condition(arg))) {
				state.data = dataBeforeRule;  // Restore to prevent leakage of potential mutations in condition

				return false;  // Skip due to condition check
			}

			// Execute 'execute'. If 'condition' was true, proceed while maintaining its side effects.
			state.data      = await rule.process.execute(arg);
			state.isApplied = true;

			state.appliedRules.push({ meta: rule.meta, spec: rule.spec });

			return false;  // Rule applied successfully, proceed to the next rule
		} catch (error) {
			const { errorEntry, shouldAbort, nextStatus } = this.handleRuleFailure(rule, error, dataBeforeRule, options);

			state.errors.push(errorEntry);
			state.status = nextStatus;

			if (shouldAbort) {
				state.data         = originalData;  // Full rollback (restore to input state or initial clone)
				state.isApplied    = false;         // Reset state
				state.appliedRules = [];            // Reset state

				return true;  // Abort the loop
			}

			state.data = dataBeforeRule;  // Partial rollback
			console.error(`Rule '${rule.meta.name}' failed, continuing...`, error);

			return false;  // Failure was non-critical, continue with the restored state
		}
	}

	/**
	 * Determines if a rule should be executed based on the current context and specs.
	 *
	 * @param   {SequenceRule<T, C>} rule    - The rule to check.
	 * @param   {C}                  context - The current context.
	 * @returns {boolean}                      True if the rule is applicable.
	 */
	private shouldExecute(rule: SequenceRule<T, C>, context: C): boolean {
		if (rule.spec?.enabled === false) {
			return false;
		}

		const env = (context && typeof context === "object") ? (context as SequenceContextBase) : null;

		// Platform filtering
		if (rule.spec?.platforms && rule.spec.platforms.length > 0) {
			const currentPlatform = env?.platform;

			if (!currentPlatform || !rule.spec.platforms.includes(currentPlatform)) {
				return false;
			}
		}

		// Lifecycle filtering
		if (rule.spec?.lifecycle) {
			const currentVersion = env?.version;

			if (!currentVersion) {
				return false;  // For safety, skip rules with lifecycle specs if version is unknown
			}
			if (rule.spec.lifecycle.introduced && compareVersions(currentVersion, rule.spec.lifecycle.introduced) === 1) {
				return false;  // Skip because the version has not reached the introduced version
			}
			if (rule.spec.lifecycle.obsoleted  && compareVersions(currentVersion, rule.spec.lifecycle.obsoleted) !== 1) {
				return false;  // Skip because the version has reached the obsoleted version
			}
		}

		return true;
	}

	/**
	 * Handles a rule execution failure.
	 *
	 * @param   {SequenceRule<T, C>} rule            - The failed rule.
	 * @param   {unknown}            error           - The thrown error.
	 * @param   {T}                  dataBeforeError - The state of data before failure.
	 * @param   {SequenceOptions<T>} options         - Execution options.
	 * @returns {object}                               An object containing the error report and control flags.
	 */
	private handleRuleFailure(
		rule           : SequenceRule<T, C>,
		error          : unknown,
		dataBeforeError: T,
		options        : SequenceOptions<T>
	): {
		errorEntry : SequenceError<T, C>;
		shouldAbort: boolean;
		nextStatus : SequenceStatus;
	} {
		const isCritical                      = rule.spec?.critical ?? true;
		const errorEntry: SequenceError<T, C> = {
			rule,
			error: error instanceof Error ? error : new Error(String(error))
		};

		if (options.captureErrorSnapshots !== false) {
			errorEntry.dataBeforeError = dataBeforeError;
		}

		const shouldAbort                = isCritical || !!options.failFast;
		const nextStatus: SequenceStatus = shouldAbort ? "failed" : "partial_success";

		return {
			errorEntry,
			shouldAbort,
			nextStatus
		};
	}
}