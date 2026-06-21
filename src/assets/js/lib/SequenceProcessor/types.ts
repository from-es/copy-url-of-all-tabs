/**
 * Type definitions for the SequenceProcessor library.
 *
 * @file
 * @lastModified 2026-06-20
 */

/**
 * Metadata for a sequence rule, containing basic identification information.
 */
type SequenceMeta = {
	name     : string;
	author?  : string;
	authored?: string;
	version? : string;
	links?   : {
		homepage?: string;
		bugs    ?: string;
	};
};

/**
 * Detailed description of a sequence rule's purpose and action.
 */
type SequenceDescription = {
	reason : string;
	target?: string;
	action?: string;
};

/**
 * Specification for the execution behavior and environment constraints of a rule.
 */
type SequenceSpec = {
	enabled  ?: boolean;
	critical ?: boolean;
	platforms?: string[];
	lifecycle?: {
		introduced?: string;
		obsoleted ?: string;
	};
};

/**
 * Defines a single rule within a sequence.
 *
 * @template T - The type of the data object being processed.
 * @template C - The type of the context object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Generic context 'C' can be any user-defined shape.
type SequenceRule<T, C = any> = {
	meta    : SequenceMeta & { description: SequenceDescription };
	spec   ?: SequenceSpec;
	process : {
		/**
		 * Determines if the rule should be applied to the current data and context.
		 *
		 * @param {SequenceArgument<T, C>} arg - The execution argument.
		 * @returns {Promise<boolean> | boolean} True if the rule should be executed.
		 */
		condition: (arg: SequenceArgument<T, C>) => Promise<boolean> | boolean;

		/**
		 * Executes the actual data transformation logic.
		 *
		 * @param {SequenceArgument<T, C>} arg - The execution argument.
		 * @returns {Promise<T> | T} The transformed data object.
		 */
		execute  : (arg: SequenceArgument<T, C>) => Promise<T> | T;
	};
	order?: number;
};

/**
 * Configuration options for the sequence execution process.
 *
 * @template T - The type of the data object.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- The data structure 'T' is generic and its shape is determined by the consumer.
type SequenceOptions<T = any> = {
	cloneFn              ?: (data: T) => T;
	failFast             ?: boolean;
	captureErrorSnapshots?: boolean;
	immutableInput       ?: boolean;
};

/**
 * Base properties expected in a context object for standard filtering (platform, version).
 */
type SequenceContextBase = {
	platform?: string;
	version ?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Allows for arbitrary additional context properties provided by specific implementations.
	[key: string]: any;
};

/**
 * Argument object passed to the condition and execute functions of a rule.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type SequenceArgument<T, C> = {
	data   : T;
	context: C;
	/** @deprecated Use `context` instead. Provided for backward compatibility with MigrationRule. */
	defaultValues?: C;
};

/**
 * Represents the status of the entire sequence execution.
 */
type SequenceStatus = "success" | "partial_success" | "failed";

/**
 * Information about an error that occurred during rule execution.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type SequenceError<T, C> = {
	rule           : SequenceRule<T, C>;
	error          : Error;
	dataBeforeError?: T;
};

/**
 * The final result object returned by the SequenceProcessor.
 *
 * @template T - The type of the data object.
 * @template C - The type of the context object.
 */
type SequenceResult<T, C> = {
	data        : T;
	status      : SequenceStatus;
	isApplied   : boolean;
	appliedRules: { meta: SequenceMeta; spec: SequenceSpec | undefined }[];
	errors      : SequenceError<T, C>[];
};



export type {
	SequenceMeta,
	SequenceDescription,
	SequenceSpec,
	SequenceRule,
	SequenceOptions,
	SequenceContextBase,
	SequenceArgument,
	SequenceStatus,
	SequenceError,
	SequenceResult
};