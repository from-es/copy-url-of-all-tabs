// Import Module
import { cloneObject } from "@/assets/js/lib/user/CloneObject";

// Import Types
import {
	type MigrationArgument,
	type MigrationRule,
	type MigrationResult,
	type MigrationOptions,
	type MigrationErrorReport,
	type MigrationRuleMeta
} from "./types";

/**
 * Represents the internal state during a migration process.
 * @template T The type of the data object being migrated.
 */
type MigrationExecutionState<T> = {
	originalData: T;
	argument    : MigrationArgument<T>;
	isExecuted  : boolean;
	appliedRules: MigrationRuleMeta[];
	errorReports: MigrationErrorReport<T>[];
};

/**
 * Manages the data migration process based on a provided set of rules.
 *
 * @template T The type of the data object to be migrated.
 * @lastupdate 2026/02/27
 */
export class MigrationManager<T> {
	/**
	 * A sorted array of migration rules to be applied.
	 * @private
	 */
	private readonly rules: readonly MigrationRule<T>[];

	/**
	 * Initializes a new instance of the MigrationManager.
	 * @param {readonly MigrationRule<T>[]} rules - A sorted array of migration rules.
	 */
	public constructor(rules: readonly MigrationRule<T>[]) {
		this.rules = rules;
	}

	/**
	 * Initializes the migration state before starting the process.
	 *
	 * @private
	 * @param   {T}                          data          - The initial data.
	 * @param   {Partial<T>}                 defaultValues - The default values.
	 * @returns {MigrationExecutionState<T>}               - The initial migration state.
	 */
	#initializeState(data: T, defaultValues: Partial<T>): MigrationExecutionState<T> {
		return {
			originalData: cloneObject(data),
			argument: {
				data: cloneObject(data),
				defaultValues: cloneObject(defaultValues)
			},
			isExecuted: false,
			appliedRules: [],
			errorReports: []
		};
	}

	/**
	 * Applies a single migration rule and updates the state accordingly.
	 *
	 * @private
	 * @param   {MigrationRule<T>}           rule  - The migration rule to apply.
	 * @param   {MigrationExecutionState<T>} state - The current migration state.
	 * @returns {Promise<void>}                    - A promise that resolves when the rule has been processed.
	 */
	async #applyRule(rule: MigrationRule<T>, state: MigrationExecutionState<T>): Promise<void> {
		const dataBeforeRule = cloneObject(state.argument.data);
		const defaultMeta: MigrationRuleMeta = {
			author : "unknown",
			reason : "This rule does not have a meta property.",
			target : "unknown",
			action : "unknown",
			authored: "1970-01-01",
			version: {
				introduced: "0.0.0",
				obsoleted : null
			}
		};

		try {
			if (await rule.condition(state.argument)) {
				state.argument.data = await rule.execute(state.argument);
				state.isExecuted    = true;
				state.appliedRules.push(rule.meta ?? defaultMeta);
			}
		} catch (e) {
			const error = e instanceof Error ? e : new Error(String(e));

			const errorReport: MigrationErrorReport<T> = {
				rule : rule.meta ?? defaultMeta,
				error: error,
				data : dataBeforeRule
			};
			state.errorReports.push(errorReport);

			console.error("ERROR(migration): Exception: failed to execute migration rule", errorReport);

			// Rollback to the state before this rule
			state.argument.data = cloneObject(dataBeforeRule);
		}
	}

	/**
	 * Builds the final migration result from the execution state.
	 *
	 * @private
	 * @param   {MigrationExecutionState<T>} state - The final migration state.
	 * @returns {MigrationResult<T>}               - The result of the migration.
	 */
	#buildResult(state: MigrationExecutionState<T>): MigrationResult<T> {
		const hasError    = state.errorReports.length > 0;
		const isSucceeded = state.isExecuted && !hasError;

		return {
			isSucceeded,
			isExecuted  : state.isExecuted,
			hasError,
			appliedRules: state.appliedRules,
			errorReports: state.errorReports,
			data        : isSucceeded ? state.argument.data : state.originalData
		};
	}

	/**
	 * Asynchronously applies migration rules to a data object.
	 *
	 * @param   {T}                           data          - The data to be migrated.
	 * @param   {Partial<T>}                  defaultValues - An object containing default values to be used during migration.
	 * @param   {MigrationOptions}            [options]     - Options to control the migration process.
	 * @returns {Promise<MigrationResult<T>>}               - The result of the migration.
	 */
	public async migrate(data: T, defaultValues: Partial<T>, options?: MigrationOptions): Promise<MigrationResult<T>> {
		const state = this.#initializeState(data, defaultValues);

		for (const rule of this.rules) {
			await this.#applyRule(rule, state);

			if (options?.failFast && state.errorReports.length > 0) {
				break;
			}
		}

		return this.#buildResult(state);
	}
}