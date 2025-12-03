/**
 * Metadata for a migration rule, intended for developer information. Not used in processing.
 */
export type MigrationRuleMeta = {
	author  : string;
	reason  : string;
	target  : string;
	action  : string;
	authored: string; // YYYY-MM-DD format
	version : {
		introduced: string;
		obsoleted : string | null;
	};
};

/**
 * Arguments passed to the execution context of a migration rule.
 * @template T The type of the data being migrated.
 */
export type MigrationArgument<T> = {
	data         : T;
	defaultValues: Partial<T>;
};

/**
 * Defines a single migration rule.
 * @template T The type of the data being migrated.
 */
export type MigrationRule<T> = {
	meta     ?: MigrationRuleMeta;
	order    ?: number; // Execution order of the rule.
	condition : (argument: MigrationArgument<T>) => Promise<boolean> | boolean;
	execute   : (argument: MigrationArgument<T>) => Promise<T> | T;
};

/**
 * A report for an error that occurred during a migration.
 * @template T The type of the data being migrated.
 */
export type MigrationErrorReport<T> = {
	rule : MigrationRuleMeta;
	error: Error;
	data : T; // The state of data before the failed rule was applied.
};

/**
 * The overall result of the migration process.
 * @template T The type of the data being migrated.
 */
export type MigrationResult<T> = {
	isSucceeded : boolean;
	isExecuted  : boolean;
	hasError    : boolean;
	appliedRules: MigrationRuleMeta[];
	errorReports: MigrationErrorReport<T>[];
	data        : T;
};

/**
 * Options to configure the migration execution.
 */
export type MigrationOptions = {
	failFast?: boolean; // If true, the migration stops immediately on the first error.
};